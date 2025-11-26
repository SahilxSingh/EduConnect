import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI is not configured. Missing GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const prompt = [
      "You are an educational assistant for college students.",
      "Explain concepts clearly and concisely, using simple language.",
      "If the question is unclear or missing information, say what is missing and suggest what the student should provide.",
      "Avoid hallucinating facts; if you don’t know, say that you don’t know.",
      "",
      `Student question: ${question}`,
    ].join("\n");

    // Use Gemini 2.5 models (these are the available models based on the API response)
    // Try flash first (faster), then pro preview versions
    const modelsToTry = [
      { name: "gemini-2.5-flash", version: "v1beta" },
      { name: "gemini-2.5-pro-preview-06-05", version: "v1beta" },
      { name: "gemini-2.5-pro-preview-05-06", version: "v1beta" },
      { name: "gemini-2.5-pro-preview-03-25", version: "v1beta" },
    ];

    let lastError = null;
    let lastErrorDetails = null;
    let data = null;
    let response = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${encodeURIComponent(apiKey)}`;
        
        console.log(`Trying model: ${model.name} with version ${model.version}`);
        
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        });

        const responseText = await response.text();
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`Failed to parse response for ${model.name}:`, responseText);
          lastError = { message: "Invalid JSON response", responseText };
          continue;
        }

        if (response.ok && data?.candidates?.[0]?.content?.parts) {
          console.log(`Success with model: ${model.name}`);
          break; // Success, exit loop
        } else {
          lastError = data;
          lastErrorDetails = {
            model: model.name,
            version: model.version,
            status: response.status,
            statusText: response.statusText,
            error: data?.error || data,
          };
          console.warn(`Model ${model.name} failed:`, lastErrorDetails);
        }
      } catch (err) {
        lastError = err;
        lastErrorDetails = {
          model: model.name,
          error: err.message,
          stack: err.stack,
        };
        console.warn(`Model ${model.name} threw error:`, err);
      }
    }

    if (!response || !response.ok || !data?.candidates?.[0]?.content?.parts) {
      console.error("All Gemini models failed. Last error details:", lastErrorDetails);
      
      // Try to get list of available models for better error message
      let availableModels = null;
      try {
        const listResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
        );
        if (listResponse.ok) {
          const listData = await listResponse.json();
          availableModels = listData?.models?.map(m => m.name) || [];
        }
      } catch (listErr) {
        console.warn("Could not fetch available models:", listErr);
      }
      
      const errorMessage = lastError?.error?.message || 
                          lastError?.message || 
                          lastErrorDetails?.error?.message ||
                          "Unknown error";
      
      let userMessage = "Failed to get AI answer. Please try again.";
      if (availableModels && availableModels.length > 0) {
        userMessage += ` Available models: ${availableModels.slice(0, 5).join(", ")}`;
      }
      
      return NextResponse.json(
        { 
          error: userMessage,
          details: errorMessage,
          availableModels: process.env.NODE_ENV === "development" ? availableModels : undefined,
          debug: process.env.NODE_ENV === "development" ? lastErrorDetails : undefined
        },
        { status: 500 }
      );
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("") || "";

    if (!answer) {
      return NextResponse.json(
        { error: "AI did not return an answer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json(
      { error: "Internal error while getting AI answer" },
      { status: 500 }
    );
  }
}



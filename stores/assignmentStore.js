import { create } from "zustand";

export const useAssignmentStore = create((set) => ({
  assignments: [],
  submissions: {},
  courses: [],
  loading: false,
  error: null,
  
  setAssignments: (assignments) => set({ assignments }),
  
  addAssignment: (assignment) => set((state) => ({
    assignments: [assignment, ...state.assignments],
  })),
  
  updateAssignment: (assignmentId, updates) => set((state) => ({
    assignments: state.assignments.map((assignment) =>
      assignment.id === assignmentId
        ? { ...assignment, ...updates }
        : assignment
    ),
  })),
  
  setSubmissions: (assignmentId, submissions) => set((state) => ({
    submissions: {
      ...state.submissions,
      [assignmentId]: submissions,
    },
  })),
  
  addSubmission: (assignmentId, submission) => set((state) => ({
    submissions: {
      ...state.submissions,
      [assignmentId]: [
        ...(state.submissions[assignmentId] || []),
        submission,
      ],
    },
  })),
  
  setCourses: (courses) => set({ courses }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
}));


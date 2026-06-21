export type Student = {
  id: string;
  name: string;
  age: number;
  email: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
};

export type Enrollment = {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at?: string | null;
};

export type Health = {
  status: "ok";
  service: string;
  version: string;
  mongodb: "ok";
};

type ApiErrorBody = {
  detail?: string | Array<{ msg: string }>;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Ошибка запроса (${response.status})`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((item) => item.msg).join(", ");
      }
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/health"),
  seed: () => request<{ message: string }>("/seed/", { method: "POST" }),

  students: () => request<Student[]>("/students/"),
  createStudent: (payload: Omit<Student, "id">) =>
    request<Student>("/students/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStudent: (id: string, payload: Omit<Student, "id">) =>
    request<Student>(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteStudent: (id: string) =>
    request(`/students/${id}`, { method: "DELETE" }),

  courses: () => request<Course[]>("/courses/"),
  createCourse: (payload: Omit<Course, "id">) =>
    request<Course>("/courses/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCourse: (id: string, payload: Omit<Course, "id">) =>
    request<Course>(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCourse: (id: string) =>
    request(`/courses/${id}`, { method: "DELETE" }),

  enrollments: () => request<Enrollment[]>("/enrollments/"),
  createEnrollment: (payload: Omit<Enrollment, "id">) =>
    request<Enrollment>("/enrollments/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteEnrollment: (id: string) =>
    request(`/enrollments/${id}`, { method: "DELETE" }),
};

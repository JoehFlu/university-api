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

export type Weather = {
  city: string;
  temperature: number;
  condition: string;
};

export type MockLogin = {
  status: "success";
  token: string;
  user: {
    username: string;
  };
};

export type MockUpdate = {
  status: "updated";
};

export type StudentCreate = Omit<Student, "id">;
export type StudentUpdate = Partial<StudentCreate>;
export type CourseCreate = Omit<Course, "id">;
export type CourseUpdate = Partial<CourseCreate>;
export type EnrollmentCreate = Pick<Enrollment, "student_id" | "course_id">;
export type EnrollmentUpdate = Partial<EnrollmentCreate>;
export type LoginRequest = { username: string; password: string };
export type ProfileUpdateRequest = { name?: string; email?: string };

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
  seed: () => request<{ message: string }>("/seed", { method: "POST" }),
  mockWeather: () => request<Weather>("/external/weather"),
  mockLogin: (payload: LoginRequest) =>
    request<MockLogin>("/external/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  mockProfileUpdate: (payload: ProfileUpdateRequest) =>
    request<MockUpdate>("/external/user/update", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  students: () => request<Student[]>("/students"),
  student: (id: string) => request<Student>(`/students/${id}`),
  createStudent: (payload: StudentCreate) =>
    request<Student>("/students", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStudent: (id: string, payload: StudentUpdate) =>
    request<Student>(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteStudent: (id: string) =>
    request(`/students/${id}`, { method: "DELETE" }),

  courses: () => request<Course[]>("/courses"),
  course: (id: string) => request<Course>(`/courses/${id}`),
  createCourse: (payload: CourseCreate) =>
    request<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCourse: (id: string, payload: CourseUpdate) =>
    request<Course>(`/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCourse: (id: string) =>
    request(`/courses/${id}`, { method: "DELETE" }),

  enrollments: () => request<Enrollment[]>("/enrollments"),
  enrollment: (id: string) => request<Enrollment>(`/enrollments/${id}`),
  createEnrollment: (payload: EnrollmentCreate) =>
    request<Enrollment>("/enrollments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEnrollment: (id: string, payload: EnrollmentUpdate) =>
    request<Enrollment>(`/enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteEnrollment: (id: string) =>
    request(`/enrollments/${id}`, { method: "DELETE" }),
};

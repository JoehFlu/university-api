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
  status: "ok" | "degraded";
  service: string;
  version: string;
  mongodb: "ok";
  castlemock: "ok" | "unavailable";
};

export type Weather = {
  city: string;
  temperature: number;
  condition: string;
};

export type StudentVerification = {
  status: "verified";
  reference_id: string;
  provider: string;
};

export type EnrollmentNotification = {
  status: "sent";
  message_id: string;
  channel: "email";
};

export type StudentCreate = Omit<Student, "id">;
export type StudentUpdate = Partial<StudentCreate>;
export type CourseCreate = Omit<Course, "id">;
export type CourseUpdate = Partial<CourseCreate>;
export type EnrollmentCreate = Pick<Enrollment, "student_id" | "course_id">;
export type EnrollmentUpdate = Partial<EnrollmentCreate>;
export type StudentVerificationRequest = Pick<Student, "id" | "name" | "email">;
export type EnrollmentNotificationRequest = {
  enrollment_id: string;
  student_name: string;
  email: string;
  course_title: string;
};

type ApiErrorBody = {
  detail?: string | Array<{ msg: string }>;
};

const REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        ...options?.headers,
      },
    });
  } catch (requestError) {
    if (requestError instanceof DOMException && requestError.name === "AbortError") {
      throw new Error("Сервис не ответил вовремя");
    }
    throw new Error("Нет соединения с сервисом");
  } finally {
    window.clearTimeout(timeoutId);
  }

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

async function requestAll<T>(path: string): Promise<T[]> {
  const limit = 500;
  const items: T[] = [];
  for (let offset = 0; ; offset += limit) {
    const separator = path.includes("?") ? "&" : "?";
    const page = await request<T[]>(`${path}${separator}offset=${offset}&limit=${limit}`);
    items.push(...page);
    if (page.length < limit) return items;
  }
}

export const api = {
  health: () => request<Health>("/health"),
  seed: () => request<{ message: string }>("/seed", { method: "POST" }),
  mockWeather: () => request<Weather>("/external/weather"),
  verifyStudent: (payload: StudentVerificationRequest) =>
    request<StudentVerification>("/external/student-verification", {
      method: "POST",
      body: JSON.stringify({
        student_id: payload.id,
        name: payload.name,
        email: payload.email,
      }),
    }),
  sendEnrollmentNotification: (payload: EnrollmentNotificationRequest) =>
    request<EnrollmentNotification>("/external/enrollment-notification", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  students: () => requestAll<Student>("/students"),
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

  courses: () => requestAll<Course>("/courses"),
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

  enrollments: () => requestAll<Enrollment>("/enrollments"),
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

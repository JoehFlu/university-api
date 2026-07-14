import {
  BadgeCheck,
  BookOpen,
  CircleUserRound,
  CloudSun,
  Database,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { api, Course, Enrollment, Health, Student, Weather } from "./api";

type Section = "overview" | "students" | "courses" | "enrollments" | "castlemock";
type Modal =
  | { type: "student"; item?: Student }
  | { type: "course"; item?: Course }
  | { type: "enrollment" }
  | null;

const sectionPaths: Record<Section, string> = {
  overview: "/",
  students: "/students",
  courses: "/courses",
  enrollments: "/enrollments",
  castlemock: "/castlemock",
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function waitForApi(attempts = 5): Promise<Health> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await api.health();
    } catch (requestError) {
      lastError = requestError;
      if (attempt < attempts) {
        await wait(attempt * 500);
      }
    }
  }
  throw lastError;
}

const serviceUrl = (port: number, path: string) =>
  `${window.location.protocol}//${window.location.hostname}:${port}${path}`;

const API_DOCS_URL = serviceUrl(8000, "/docs");
const CASTLEMOCK_URL = serviceUrl(8080, "/castlemock");

function getSectionFromPath(pathname: string): Section | null {
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  const match = Object.entries(sectionPaths).find(([, path]) => path === normalizedPath);
  return (match?.[0] as Section | undefined) ?? null;
}

const navItems: Array<{
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "students", label: "Студенты", icon: Users },
  { id: "courses", label: "Курсы", icon: BookOpen },
  { id: "enrollments", label: "Зачисления", icon: UserPlus },
  { id: "castlemock", label: "CastleMock", icon: Database },
];

function App() {
  const [section, setSection] = useState<Section>(
    () => getSectionFromPath(window.location.pathname) ?? "overview",
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [castleMockMessage, setCastleMockMessage] = useState("");
  const [castleMockError, setCastleMockError] = useState("");
  const [castleMockLoading, setCastleMockLoading] = useState(false);
  const [castleMockConnected, setCastleMockConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [healthChecking, setHealthChecking] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadRequestId = useRef(0);
  const noticeTimer = useRef<number | null>(null);
  const mutationInFlight = useRef(false);
  const castleMockActionInFlight = useRef(false);

  const navigateTo = useCallback((nextSection: Section) => {
    const nextPath = sectionPaths[nextSection];
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setSection(nextSection);
    setSearch("");
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!getSectionFromPath(window.location.pathname)) {
      window.history.replaceState({}, "", sectionPaths.overview);
    }

    const handlePopState = () => {
      const nextSection = getSectionFromPath(window.location.pathname);
      if (nextSection) {
        setSection(nextSection);
        setSearch("");
        setSidebarOpen(false);
      } else {
        window.history.replaceState({}, "", sectionPaths.overview);
        setSection("overview");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setLoading(true);
    setError("");
    try {
      const nextHealth = await waitForApi();
      if (requestId !== loadRequestId.current) return;
      setHealth(nextHealth);
      setCastleMockConnected(nextHealth.castlemock === "ok");
      const results = await Promise.allSettled([
        api.students(),
        api.courses(),
        api.enrollments(),
      ]);
      if (requestId !== loadRequestId.current) return;
      const [studentsResult, coursesResult, enrollmentsResult] = results;
      if (studentsResult.status === "fulfilled") setStudents(studentsResult.value);
      if (coursesResult.status === "fulfilled") setCourses(coursesResult.value);
      if (enrollmentsResult.status === "fulfilled") setEnrollments(enrollmentsResult.value);
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) {
        setError(`Не удалось загрузить часть данных (${failed.length} из 3)`);
      }
    } catch (requestError) {
      if (requestId !== loadRequestId.current) return;
      setHealth(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось загрузить данные",
      );
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadMockWeather = useCallback(async () => {
    if (castleMockActionInFlight.current) return;
    castleMockActionInFlight.current = true;
    setCastleMockLoading(true);
    setCastleMockError("");
    try {
      setWeather(await api.mockWeather());
      setCastleMockConnected(true);
      setCastleMockMessage("Прогноз получен");
    } catch (requestError) {
      setWeather(null);
      setCastleMockConnected(false);
      setCastleMockError(
        requestError instanceof Error
          ? requestError.message
          : "CastleMock недоступен",
      );
    } finally {
      castleMockActionInFlight.current = false;
      setCastleMockLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === "castlemock") {
      void loadMockWeather();
    }
  }, [section, loadMockWeather]);

  const showNotice = (message: string) => {
    if (noticeTimer.current !== null) {
      window.clearTimeout(noticeTimer.current);
    }
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => {
      setNotice("");
      noticeTimer.current = null;
    }, 2600);
  };

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const runMutation = async <T,>(
    action: () => Promise<T>,
    apply: (result: T) => void,
    message: string,
  ) => {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    loadRequestId.current += 1;
    setMutating(true);
    setError("");
    try {
      apply(await action());
      setModal(null);
      showNotice(message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось выполнить действие",
      );
    } finally {
      mutationInFlight.current = false;
      setMutating(false);
    }
  };

  const handleSeed = async () => {
    if (mutationInFlight.current) return;
    if (!window.confirm("Перезаполнить базу тестовыми данными?")) return;
    mutationInFlight.current = true;
    setMutating(true);
    setError("");
    try {
      await api.seed();
      await loadData();
      showNotice("Тестовые данные созданы");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось заполнить базу");
    } finally {
      mutationInFlight.current = false;
      setMutating(false);
    }
  };

  const checkHealth = async () => {
    setHealthChecking(true);
    setError("");
    try {
      const nextHealth = await api.health();
      setHealth(nextHealth);
      setCastleMockConnected(nextHealth.castlemock === "ok");
      showNotice("Состояние сервисов обновлено");
    } catch (requestError) {
      setHealth(null);
      setCastleMockConnected(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось проверить состояние сервисов",
      );
    } finally {
      setHealthChecking(false);
    }
  };

  const runCastleMockAction = async <T,>(
    action: () => Promise<T>,
    getMessage: (result: T) => string,
  ) => {
    if (castleMockActionInFlight.current) return;
    castleMockActionInFlight.current = true;
    setCastleMockLoading(true);
    setCastleMockError("");
    try {
      const result = await action();
      setCastleMockConnected(true);
      setCastleMockMessage(getMessage(result));
    } catch (requestError) {
      setCastleMockConnected(false);
      setCastleMockError(
        requestError instanceof Error
          ? requestError.message
          : "CastleMock недоступен",
      );
    } finally {
      castleMockActionInFlight.current = false;
      setCastleMockLoading(false);
    }
  };

  const handleDelete = async (
    entity: "student" | "course" | "enrollment",
    id: string,
  ) => {
    if (!window.confirm("Удалить эту запись?")) return;
    const actions = {
      student: () => api.deleteStudent(id),
      course: () => api.deleteCourse(id),
      enrollment: () => api.deleteEnrollment(id),
    };
    await runMutation(
      actions[entity],
      () => {
        if (entity === "student") {
          setStudents((items) => items.filter((item) => item.id !== id));
          setEnrollments((items) =>
            items.filter((item) => item.student_id !== id),
          );
        }
        if (entity === "course") {
          setCourses((items) => items.filter((item) => item.id !== id));
          setEnrollments((items) =>
            items.filter((item) => item.course_id !== id),
          );
        }
        if (entity === "enrollment") setEnrollments((items) => items.filter((item) => item.id !== id));
      },
      "Запись удалена",
    );
  };

  const titles: Record<Section, { title: string; subtitle: string }> = {
    overview: {
      title: "Обзор университета",
      subtitle: "Статистика, зачисления и состояние сервисов",
    },
    students: {
      title: "Студенты",
      subtitle: "Управляйте профилями и контактными данными.",
    },
    courses: {
      title: "Курсы",
      subtitle: "Создавайте и обновляйте учебные программы.",
    },
    enrollments: {
      title: "Зачисления",
      subtitle: "Назначайте студентам доступные курсы.",
    },
    castlemock: {
      title: "CastleMock",
      subtitle: "Проверяйте тестовые ответы внешнего сервиса.",
    },
  };

  const currentTitle = titles[section];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand__mark">
            <GraduationCap size={25} strokeWidth={2.2} />
          </div>
          <div>
            <strong>University</strong>
            <span>Admin panel</span>
          </div>
          <button
            className="icon-button sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрыть меню"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={sectionPaths[item.id]}
                className={`navigation__item ${
                  section === item.id ? "navigation__item--active" : ""
                }`}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }
                  event.preventDefault();
                  navigateTo(item.id);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu size={21} />
          </button>
          {section !== "overview" && section !== "castlemock" && (
            <>
              <div className="topbar__search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по текущему разделу..."
                />
              </div>
              <button
                className="icon-button"
                onClick={() => void loadData()}
                aria-label="Обновить данные"
              >
                <RefreshCw size={18} className={loading ? "spin" : ""} />
              </button>
            </>
          )}
          <div className="profile">
            <div className="profile__avatar">A</div>
            <div>
              <strong>Администратор</strong>
              <span>Учебный отдел</span>
            </div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              {section !== "overview" && section !== "castlemock" && (
                <p className="eyebrow">University workspace</p>
              )}
              <h1>{currentTitle.title}</h1>
              <p>{currentTitle.subtitle}</p>
            </div>
            <div className="page-heading__actions">
              {section === "overview" && (
                <button
                  className="button button--primary"
                  onClick={() => void handleSeed()}
                  disabled={mutating}
                >
                  <Database size={17} />
                  Загрузить тестовые данные
                </button>
              )}
              {section !== "overview" && section !== "castlemock" && (
                <button
                  className="button button--primary"
                  onClick={() =>
                    setModal({
                      type:
                        section === "students"
                          ? "student"
                          : section === "courses"
                            ? "course"
                            : "enrollment",
                    })
                  }
                >
                  <Plus size={18} />
                  Добавить
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert--error">
              <span>{error}</span>
              <button onClick={() => setError("")}>Закрыть</button>
            </div>
          )}

          {notice && <div className="toast">{notice}</div>}

          {loading ? (
            <div className="loading-state">
              <LoaderCircle size={28} className="spin" />
              <span>Загружаем данные...</span>
            </div>
          ) : (
            <>
              {section === "overview" && (
                <Overview
                  students={students}
                  courses={courses}
                  enrollments={enrollments}
                  health={health}
                  onNavigate={navigateTo}
                  onOpenModal={setModal}
                  onCheckHealth={() => void checkHealth()}
                  healthChecking={healthChecking}
                  castleMockConnected={castleMockConnected}
                />
              )}
              {section === "students" && (
                <StudentsTable
                  students={students}
                  query={search}
                  onEdit={(item) => setModal({ type: "student", item })}
                  onDelete={(id) => void handleDelete("student", id)}
                />
              )}
              {section === "courses" && (
                <CoursesGrid
                  courses={courses}
                  enrollments={enrollments}
                  query={search}
                  onEdit={(item) => setModal({ type: "course", item })}
                  onDelete={(id) => void handleDelete("course", id)}
                />
              )}
              {section === "enrollments" && (
                <EnrollmentsTable
                  enrollments={enrollments}
                  students={students}
                  courses={courses}
                  query={search}
                  onDelete={(id) => void handleDelete("enrollment", id)}
                />
              )}
              {section === "castlemock" && (
                <section className="castlemock-page">
                  <CastleMockWidget
                    students={students}
                    courses={courses}
                    enrollments={enrollments}
                    weather={weather}
                    message={castleMockMessage}
                    error={castleMockError}
                    loading={castleMockLoading}
                    connected={castleMockConnected}
                    onRefreshWeather={() => void loadMockWeather()}
                    onVerifyStudent={(student) =>
                      void runCastleMockAction(
                        () => api.verifyStudent(student),
                        (result) =>
                          `Студент проверен · ${result.reference_id} · ${result.provider}`,
                      )
                    }
                    onSendEnrollmentNotification={(enrollment, student, course) =>
                      void runCastleMockAction(
                        () =>
                          api.sendEnrollmentNotification({
                            enrollment_id: enrollment.id,
                            student_name: student.name,
                            email: student.email,
                            course_title: course.title,
                          }),
                        (result) =>
                          `Уведомление отправлено · ${result.message_id} · ${result.channel}`,
                      )
                    }
                  />
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {modal?.type === "student" && (
        <StudentModal
          item={modal.item}
          loading={mutating}
          onClose={() => setModal(null)}
          onSubmit={(payload) =>
            void runMutation(
              () =>
                modal.item
                  ? api.updateStudent(modal.item.id, payload)
                  : api.createStudent(payload),
              (student) =>
                setStudents((items) =>
                  modal.item
                    ? items.map((item) => (item.id === student.id ? student : item))
                    : [...items, student],
                ),
              modal.item ? "Студент обновлён" : "Студент добавлен",
            )
          }
        />
      )}
      {modal?.type === "course" && (
        <CourseModal
          item={modal.item}
          loading={mutating}
          onClose={() => setModal(null)}
          onSubmit={(payload) =>
            void runMutation(
              () =>
                modal.item
                  ? api.updateCourse(modal.item.id, payload)
                  : api.createCourse(payload),
              (course) =>
                setCourses((items) =>
                  modal.item
                    ? items.map((item) => (item.id === course.id ? course : item))
                    : [...items, course],
                ),
              modal.item ? "Курс обновлён" : "Курс добавлен",
            )
          }
        />
      )}
      {modal?.type === "enrollment" && (
        <EnrollmentModal
          students={students}
          courses={courses}
          loading={mutating}
          onClose={() => setModal(null)}
          onSubmit={(payload) =>
            void runMutation(
              () => api.createEnrollment(payload),
              (enrollment) => setEnrollments((items) => [...items, enrollment]),
              "Студент зачислен на курс",
            )
          }
        />
      )}
    </div>
  );
}

function Overview({
  students,
  courses,
  enrollments,
  health,
  onNavigate,
  onOpenModal,
  onCheckHealth,
  healthChecking,
  castleMockConnected,
}: {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  health: Health | null;
  onNavigate: (section: Section) => void;
  onOpenModal: (modal: Modal) => void;
  onCheckHealth: () => void;
  healthChecking: boolean;
  castleMockConnected: boolean;
}) {
  const stats = [
    {
      label: "Студенты",
      value: students.length,
      note: "Активных профилей",
      section: "students" as Section,
    },
    {
      label: "Курсы",
      value: courses.length,
      note: "Доступны сейчас",
      section: "courses" as Section,
    },
    {
      label: "Зачисления",
      value: enrollments.length,
      note: "Активных зачислений",
      section: "enrollments" as Section,
    },
  ];

  const studentById = new Map(students.map((item) => [item.id, item]));
  const courseById = new Map(courses.map((item) => [item.id, item]));
  const recent = enrollments.slice(0, 10);

  return (
    <>
      <section className="stats-grid">
        {stats.map((stat) => {
          return (
            <button
              className="stat-card"
              key={stat.label}
              onClick={() => onNavigate(stat.section)}
            >
              <div className="stat-card__body">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            </button>
          );
        })}
      </section>

      <section className="dashboard-grid">
        <div className="panel enrollments-panel">
          <div className="panel__header">
            <h2>Недавние зачисления</h2>
            <button className="text-button" onClick={() => onNavigate("enrollments")}>
              Показать все
            </button>
          </div>
          {recent.length ? (
            <div className="table-scroll">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Студент</th>
                    <th>Курс</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => {
                    const student = studentById.get(item.student_id);
                    const course = courseById.get(item.course_id);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="person-cell person-cell--compact">
                            <div>
                              <strong>
                                {student?.name ?? "Неизвестный студент"}
                              </strong>
                              <span>{student?.email ?? "—"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="recent-table__course">
                            {course?.title ?? "Неизвестный курс"}
                          </span>
                        </td>
                        <td>
                          <span className="recent-table__date">
                            {formatEnrollmentDate(item.enrolled_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={UserPlus}
              title="Зачислений пока нет"
              text="Создайте первую связь между студентом и курсом."
            />
          )}
        </div>

        <div className="dashboard-side">
          <div className="panel quick-actions">
            <div className="panel__header">
              <h2>Быстрые действия</h2>
            </div>
            <div className="quick-actions__list">
              <QuickAction
                icon={UserPlus}
                label="Добавить студента"
                primary
                onClick={() => onOpenModal({ type: "student" })}
              />
              <QuickAction
                icon={BookOpen}
                label="Создать курс"
                onClick={() => onOpenModal({ type: "course" })}
              />
              <QuickAction
                icon={Users}
                label="Зачислить студента"
                onClick={() => onOpenModal({ type: "enrollment" })}
              />
              <a
                className="quick-action quick-action--link"
                href={API_DOCS_URL}
                target="_blank"
                rel="noreferrer"
              >
                <strong>Открыть API-документацию</strong>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          <div className="panel system-card">
            <div className="panel__header">
              <h2>Состояние системы</h2>
            </div>
            <div className="system-list">
              <SystemRow label="API" value={health ? "работает" : "недоступен"} ok={!!health} />
              <SystemRow
                label="База данных (MongoDB)"
                value={health ? "подключена" : "отключена"}
                ok={!!health}
              />
              <SystemRow label="Версия API" value={health?.version ?? "—"} ok={!!health} />
              <SystemRow label="Сервис" value={health?.service ?? "—"} ok={!!health} />
              <SystemRow
                label="CastleMock"
                value={castleMockConnected ? "подключён" : "недоступен"}
                ok={castleMockConnected}
              />
            </div>
            <div className="system-card__action">
              <button
                className="button button--outline"
                onClick={onCheckHealth}
                disabled={healthChecking}
              >
                <RefreshCw size={16} className={healthChecking ? "spin" : ""} />
                Проверить снова
              </button>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}

function CastleMockWidget({
  students,
  courses,
  enrollments,
  weather,
  message,
  error,
  loading,
  connected,
  onRefreshWeather,
  onVerifyStudent,
  onSendEnrollmentNotification,
}: {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  weather: Weather | null;
  message: string;
  error: string;
  loading: boolean;
  connected: boolean;
  onRefreshWeather: () => void;
  onVerifyStudent: (student: Student) => void;
  onSendEnrollmentNotification: (
    enrollment: Enrollment,
    student: Student,
    course: Course,
  ) => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    enrollments[0]?.id ?? "",
  );
  const studentById = new Map(students.map((student) => [student.id, student]));
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const availableEnrollments = enrollments.flatMap((enrollment) => {
    const student = studentById.get(enrollment.student_id);
    const course = courseById.get(enrollment.course_id);
    return student && course ? [{ enrollment, student, course }] : [];
  });
  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? students[0];
  const selectedEnrollment =
    availableEnrollments.find(
      ({ enrollment }) => enrollment.id === selectedEnrollmentId,
    ) ?? availableEnrollments[0];

  return (
    <div className="panel castlemock-card">
      <div className="panel__header">
        <h2>CastleMock</h2>
        <div className="castlemock-card__header-actions">
          <span className={`service-indicator ${connected ? "" : "service-indicator--off"}`}>
            {connected ? "Подключён" : "Недоступен"}
          </span>
          <a
            className="castlemock-card__link"
            href={CASTLEMOCK_URL}
            target="_blank"
            rel="noreferrer"
          >
            Открыть сервис
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
      <div className="castlemock-card__body">
        <div className="mock-weather">
          <CloudSun size={22} />
          <div>
            <strong>
              {weather
                ? `${weather.city}, ${weather.temperature} °C`
                : "Прогноз не загружен"}
            </strong>
            <span>{weather?.condition ?? "Тестовый endpoint погоды"}</span>
          </div>
          <button
            className="icon-button"
            onClick={onRefreshWeather}
            disabled={loading}
            aria-label="Обновить тестовый прогноз"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>
        <div className="castlemock-tools">
          <div className="castlemock-tool">
            <label htmlFor="castlemock-student">Проверка студента</label>
            <div className="castlemock-tool__controls">
              <select
                id="castlemock-student"
                value={selectedStudent?.id ?? ""}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                disabled={!students.length || loading}
              >
                {!students.length && <option value="">Нет студентов</option>}
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.email}
                  </option>
                ))}
              </select>
              <button
                className="button button--secondary"
                onClick={() => selectedStudent && onVerifyStudent(selectedStudent)}
                disabled={!selectedStudent || loading}
              >
                <BadgeCheck size={15} />
                Проверить
              </button>
            </div>
            <small>Передаёт выбранного студента внешнему сервису проверки.</small>
          </div>
          <div className="castlemock-tool">
            <label htmlFor="castlemock-enrollment">Уведомление о зачислении</label>
            <div className="castlemock-tool__controls">
              <select
                id="castlemock-enrollment"
                value={selectedEnrollment?.enrollment.id ?? ""}
                onChange={(event) => setSelectedEnrollmentId(event.target.value)}
                disabled={!availableEnrollments.length || loading}
              >
                {!availableEnrollments.length && (
                  <option value="">Нет связанных зачислений</option>
                )}
                {availableEnrollments.map(({ enrollment, student, course }) => (
                  <option key={enrollment.id} value={enrollment.id}>
                    {student.name} · {course.title}
                  </option>
                ))}
              </select>
              <button
                className="button button--secondary"
                onClick={() =>
                  selectedEnrollment &&
                  onSendEnrollmentNotification(
                    selectedEnrollment.enrollment,
                    selectedEnrollment.student,
                    selectedEnrollment.course,
                  )
                }
                disabled={!selectedEnrollment || loading}
              >
                <Send size={15} />
                Отправить
              </button>
            </div>
            <small>Имитирует email после успешного зачисления на курс.</small>
          </div>
        </div>
        {(message || error) && (
          <p className={`castlemock-card__message ${error ? "castlemock-card__message--error" : ""}`}>
            {error || message}
          </p>
        )}
      </div>
    </div>
  );
}

function StudentsTable({
  students,
  query,
  onEdit,
  onDelete,
}: {
  students: Student[];
  query: string;
  onEdit: (item: Student) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = students.filter((student) =>
    `${student.name} ${student.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="panel table-panel">
      <div className="table-meta">
        <span>{filtered.length} студентов</span>
        <small>Данные синхронизированы с MongoDB</small>
      </div>
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Возраст</th>
                <th>Email</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="person-cell">
                      <div className="avatar">{initials(student.name)}</div>
                      <div>
                        <strong>{student.name}</strong>
                        <span>ID · {shortId(student.id)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="age-badge">{student.age}</span>
                  </td>
                  <td>{student.email}</td>
                  <td>
                    <RowActions
                      onEdit={() => onEdit(student)}
                      onDelete={() => onDelete(student.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={CircleUserRound}
          title="Студенты не найдены"
          text="Измените запрос или добавьте нового студента."
        />
      )}
    </div>
  );
}

function CoursesGrid({
  courses,
  enrollments,
  query,
  onEdit,
  onDelete,
}: {
  courses: Course[];
  enrollments: Enrollment[];
  query: string;
  onEdit: (item: Course) => void;
  onDelete: (id: string) => void;
}) {
  const filtered = courses.filter((course) =>
    `${course.title} ${course.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return filtered.length ? (
    <div className="course-grid">
      {filtered.map((course, index) => {
        const count = enrollments.filter(
          (item) => item.course_id === course.id,
        ).length;
        return (
          <article className="course-card" key={course.id}>
            <div className={`course-card__cover course-card__cover--${index % 4}`}>
              <BookOpen size={25} />
              <span>Курс {String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="course-card__body">
              <div className="course-card__title">
                <div>
                  <h2>{course.title}</h2>
                  <span>ID · {shortId(course.id)}</span>
                </div>
                <RowActions
                  onEdit={() => onEdit(course)}
                  onDelete={() => onDelete(course.id)}
                />
              </div>
              <p>{course.description}</p>
              <div className="course-card__footer">
                <div className="stacked-avatars">
                  {Array.from({ length: Math.min(count, 3) }, (_, avatarIndex) => (
                    <span key={avatarIndex}>
                      {String.fromCharCode(65 + avatarIndex)}
                    </span>
                  ))}
                </div>
                <strong>
                  {count} {pluralize(count, "студент", "студента", "студентов")}
                </strong>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <div className="panel">
      <EmptyState
        icon={BookOpen}
        title="Курсы не найдены"
        text="Измените запрос или создайте новый курс."
      />
    </div>
  );
}

function EnrollmentsTable({
  enrollments,
  students,
  courses,
  query,
  onDelete,
}: {
  enrollments: Enrollment[];
  students: Student[];
  courses: Course[];
  query: string;
  onDelete: (id: string) => void;
}) {
  const studentById = new Map(students.map((item) => [item.id, item]));
  const courseById = new Map(courses.map((item) => [item.id, item]));
  const filtered = enrollments.filter((enrollment) => {
    const student = studentById.get(enrollment.student_id);
    const course = courseById.get(enrollment.course_id);
    return `${student?.name} ${student?.email} ${course?.title}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  return (
    <div className="panel table-panel">
      <div className="table-meta">
        <span>{filtered.length} зачислений</span>
        <small>Текущая учебная нагрузка</small>
      </div>
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Студент</th>
                <th>Курс</th>
                <th>Дата</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((enrollment) => {
                const student = studentById.get(enrollment.student_id);
                const course = courseById.get(enrollment.course_id);
                return (
                  <tr key={enrollment.id}>
                    <td>
                      <div className="person-cell">
                        <div className="avatar">
                          {initials(student?.name ?? "?")}
                        </div>
                        <div>
                          <strong>{student?.name ?? "Студент удалён"}</strong>
                          <span>{student?.email ?? shortId(enrollment.student_id)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="course-cell">
                        <BookOpen size={17} />
                        <span>{course?.title ?? "Курс удалён"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="recent-table__date">
                        {formatEnrollmentDate(enrollment.enrolled_at)}
                      </span>
                    </td>
                    <td>
                      <RowActions
                        onDelete={() => onDelete(enrollment.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={UserPlus}
          title="Зачисления не найдены"
          text="Назначьте студенту первый учебный курс."
        />
      )}
    </div>
  );
}

function StudentModal({
  item,
  loading,
  onClose,
  onSubmit,
}: {
  item?: Student;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Student, "id">) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [age, setAge] = useState(item?.age.toString() ?? "18");
  const [email, setEmail] = useState(item?.email ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ name, age: Number(age), email });
  };

  return (
    <ModalFrame
      title={item ? "Редактировать студента" : "Новый студент"}
      subtitle="Основная информация и контактные данные"
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <Field label="Имя и фамилия">
          <input
            required
            minLength={1}
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Иван Петров"
          />
        </Field>
        <div className="form-grid">
          <Field label="Возраст">
            <input
              required
              type="number"
              min={16}
              max={120}
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
          </Field>
        </div>
        <ModalActions loading={loading} onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function CourseModal({
  item,
  loading,
  onClose,
  onSubmit,
}: {
  item?: Course;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Course, "id">) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ title, description });
  };

  return (
    <ModalFrame
      title={item ? "Редактировать курс" : "Новый курс"}
      subtitle="Название и краткое описание программы"
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <Field label="Название курса">
          <input
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Введение в Python"
          />
        </Field>
        <Field label="Описание">
          <textarea
            required
            rows={5}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Расскажите, чему научатся студенты..."
          />
        </Field>
        <ModalActions loading={loading} onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function EnrollmentModal({
  students,
  courses,
  loading,
  onClose,
  onSubmit,
}: {
  students: Student[];
  courses: Course[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Enrollment, "id">) => void;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ student_id: studentId, course_id: courseId });
  };

  return (
    <ModalFrame
      title="Новое зачисление"
      subtitle="Выберите студента и учебный курс"
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <Field label="Студент">
          <select
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            {students.map((student) => (
              <option value={student.id} key={student.id}>
                {student.name} · {student.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Курс">
          <select
            required
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </Field>
        {(!students.length || !courses.length) && (
          <div className="form-warning">
            Сначала добавьте хотя бы одного студента и один курс.
          </div>
        )}
        <ModalActions
          loading={loading || !students.length || !courses.length}
          onClose={onClose}
        />
      </form>
    </ModalFrame>
  );
}

function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ModalActions({
  loading,
  onClose,
}: {
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="modal__actions">
      <button type="button" className="button button--ghost" onClick={onClose}>
        Отмена
      </button>
      <button type="submit" className="button button--primary" disabled={loading}>
        {loading && <LoaderCircle size={17} className="spin" />}
        Сохранить
      </button>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="row-actions">
      {onEdit && (
        <button onClick={onEdit} aria-label="Редактировать">
          <Pencil size={16} />
        </button>
      )}
      <button className="row-actions__delete" onClick={onDelete} aria-label="Удалить">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <div>
        <Icon size={24} />
      </div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function SystemRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="system-row">
      {ok !== undefined && <i className={ok ? "" : "off"} />}
      <span>{label}:</span>
      <strong>{value}</strong>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: typeof Users;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      className={`quick-action ${primary ? "quick-action--primary" : ""}`}
      onClick={onClick}
    >
      <Icon size={17} />
      <strong>{label}</strong>
    </button>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function shortId(id: string) {
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function pluralize(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function formatEnrollmentDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(" г.", "");
}

export default App;

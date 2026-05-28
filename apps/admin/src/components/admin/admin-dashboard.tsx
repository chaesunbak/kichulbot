"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { BookOpen, LogOut, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, Paper, Taxonomy, User } from "@/lib/api";
import {
  clearStoredToken,
  readStoredToken,
  storeToken,
} from "@/lib/auth-storage";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("관리자 이메일을 입력해 주세요."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(72, "비밀번호는 72자 이하여야 합니다."),
});

const paperSchema = z.object({
  title: z
    .string()
    .min(2, "문제지 제목을 입력해 주세요.")
    .max(100, "문제지 제목은 100자 이하여야 합니다."),
  year: z
    .number()
    .int("연도는 정수로 입력해 주세요.")
    .min(1994, "1994년 이후 연도를 입력해 주세요.")
    .max(2100, "2100년 이하 연도를 입력해 주세요."),
  examId: z.string().min(1, "시험을 선택해 주세요."),
  subjectId: z.string().min(1, "과목을 선택해 주세요."),
  questionCount: z
    .number()
    .int("문항 수는 정수로 입력해 주세요.")
    .min(1, "문항 수는 1개 이상이어야 합니다.")
    .max(100, "문항 수는 100개 이하여야 합니다."),
  isPublished: z.enum(["false", "true"]),
});

type LoginValues = z.infer<typeof loginSchema>;
type PaperValues = z.infer<typeof paperSchema>;

export function AdminDashboard() {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [exams, setExams] = React.useState<Taxonomy[]>([]);
  const [subjects, setSubjects] = React.useState<Taxonomy[]>([]);
  const [isBooting, setIsBooting] = React.useState(true);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const paperForm = useForm<PaperValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      title: "",
      year: new Date().getFullYear(),
      examId: "",
      subjectId: "",
      questionCount: 20,
      isPublished: "false",
    },
  });

  const loadAdminData = React.useCallback(
    async (accessToken: string, options?: { silent?: boolean }) => {
      setIsLoadingData(true);

      try {
        const [meData, papersData, examsData, subjectsData] = await Promise.all([
          apiRequest("/auth/me", MeResponseSchema.parse, {
            token: accessToken,
          }),
          apiRequest("/papers", ListPapersResponseSchema.parse, {
            token: accessToken,
          }),
          apiRequest("/exams", ListExamsResponseSchema.parse, {
            token: accessToken,
          }),
          apiRequest("/subjects", ListSubjectsResponseSchema.parse, {
            token: accessToken,
          }),
        ]);

        if (meData.user.role !== "ADMIN") {
          throw new Error("관리자 권한이 있는 계정으로 로그인해 주세요.");
        }

        setUser(meData.user);
        setPapers(papersData.papers.filter(isAdminPaper));
        setExams(examsData.exams);
        setSubjects(subjectsData.subjects);

        if (!options?.silent) {
          toast.success("관리자 데이터를 불러왔습니다.");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "데이터를 불러오지 못했습니다.";

        clearStoredToken();
        setToken(null);
        setUser(null);
        toast.error(message);
      } finally {
        setIsLoadingData(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBooting(false);
      return;
    }

    setToken(storedToken);
    loadAdminData(storedToken, { silent: true }).finally(() =>
      setIsBooting(false),
    );
  }, [loadAdminData]);

  async function handleLogin(values: LoginValues) {
    try {
      const data = await apiRequest("/auth/login", AuthResponseSchema.parse, {
        method: "POST",
        body: values,
      });

      if (data.user.role !== "ADMIN") {
        throw new Error("관리자 권한이 있는 계정으로 로그인해 주세요.");
      }

      storeToken(data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
      toast.success("로그인했습니다.");
      await loadAdminData(data.accessToken, { silent: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
    }
  }

  function handleLogout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setPapers([]);
    setExams([]);
    setSubjects([]);
    toast("로그아웃했습니다.");
  }

  async function handleCreatePaper(values: PaperValues) {
    if (!token) {
      toast.error("먼저 로그인해 주세요.");
      return;
    }

    try {
      const data = await apiRequest("/papers", CreatePaperResponseSchema.parse, {
        method: "POST",
        token,
        body: {
          title: values.title,
          year: values.year,
          examId: values.examId,
          subjectId: values.subjectId,
          questionCount: values.questionCount,
          isPublished: values.isPublished === "true",
        },
      });

      setPapers((current) => [data.paper, ...current]);
      paperForm.reset({
        title: "",
        year: values.year,
        examId: values.examId,
        subjectId: values.subjectId,
        questionCount: 20,
        isPublished: "false",
      });
      toast.success("문제지를 생성했습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "문제지 생성에 실패했습니다.",
      );
    }
  }

  if (isBooting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          관리자 세션 확인 중
        </div>
      </main>
    );
  }

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <CardTitle>기출봇 관리자</CardTitle>
            <CardDescription>
              관리자 계정으로 로그인해 문제지 데이터를 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={loginForm.handleSubmit(handleLogin)}
            >
              <Controller
                name="email"
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>이메일</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="admin@example.com"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={loginForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>비밀번호</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="8자 이상"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Button
                className="w-full"
                type="submit"
                disabled={loginForm.formState.isSubmitting}
              >
                로그인
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <h1 className="text-xl font-semibold tracking-normal">
                기출봇 관리자
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email ?? user.nickname ?? "관리자"} 계정으로 접속 중
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => token && loadAdminData(token)}
              disabled={isLoadingData}
            >
              <RefreshCw
                className={cn("size-4", isLoadingData && "animate-spin")}
                aria-hidden="true"
              />
              새로고침
            </Button>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" aria-hidden="true" />
              문제지 등록
            </CardTitle>
            <CardDescription>
              Phase 2 데이터 기준으로 시험, 과목, 연도와 문항 수를 저장합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={paperForm.handleSubmit(handleCreatePaper)}
            >
              <FieldGroup>
                <Controller
                  name="title"
                  control={paperForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>문제지 제목</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="2025학년도 수능 한국사"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="year"
                    control={paperForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>시행 연도</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.value}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                          type="number"
                          inputMode="numeric"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="questionCount"
                    control={paperForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>문항 수</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.value}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                          type="number"
                          inputMode="numeric"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="examId"
                  control={paperForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>시험</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="시험 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="subjectId"
                  control={paperForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>과목</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="과목 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="isPublished"
                  control={paperForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>공개 상태</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">비공개</SelectItem>
                          <SelectItem value="true">공개</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        공개 문제지는 이후 사용자 문제지 목록에 노출됩니다.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                className="w-full"
                type="submit"
                disabled={paperForm.formState.isSubmitting}
              >
                <Plus className="size-4" aria-hidden="true" />
                문제지 생성
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4" aria-hidden="true" />
              문제지 목록
            </CardTitle>
            <CardDescription>
              등록된 문제지와 문항 등록 진행 상황을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Metric label="전체" value={papers.length} />
              <Metric
                label="공개"
                value={papers.filter((paper) => paper.isPublished).length}
              />
              <Metric
                label="문항"
                value={papers.reduce(
                  (sum, paper) => sum + (paper.registeredQuestionCount ?? 0),
                  0,
                )}
              />
            </div>
            <Separator className="mb-4" />
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>시험/과목</TableHead>
                    <TableHead>연도</TableHead>
                    <TableHead>문항</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        등록된 문제지가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    papers.map((paper) => (
                      <TableRow key={paper.id}>
                        <TableCell className="min-w-56 font-medium">
                          {paper.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {paper.exam.name} / {paper.subject.name}
                        </TableCell>
                        <TableCell>{paper.year}</TableCell>
                        <TableCell>
                          {paper.registeredQuestionCount ?? 0}/
                          {paper.questionCount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={paper.isPublished ? "default" : "secondary"}
                          >
                            {paper.isPublished ? "공개" : "비공개"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function isAdminPaper(paper: unknown): paper is Paper {
  return (
    typeof paper === "object" &&
    paper !== null &&
    "isPublished" in paper &&
    "registeredQuestionCount" in paper
  );
}
import {
  AuthResponseSchema,
  MeResponseSchema,
} from "@kichulbot/api-contract/auth";
import {
  CreatePaperResponseSchema,
  ListPapersResponseSchema,
} from "@kichulbot/api-contract/papers";
import {
  ListExamsResponseSchema,
  ListSubjectsResponseSchema,
} from "@kichulbot/api-contract/taxonomy";

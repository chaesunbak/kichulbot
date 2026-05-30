import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, LogOut, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@kichulbot/ui/components/badge';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/field';
import { Input } from '@kichulbot/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import { Separator } from '@kichulbot/ui/components/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kichulbot/ui/components/table';
import { login, fetchMe } from '@/lib/api/auth';
import { fetchPapers, createPaper } from '@/lib/api/papers';
import { fetchExams, fetchSubjects } from '@/lib/api/taxonomy';
import { loginSchema, paperSchema, LoginValues, PaperValues } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const { token, _hasHydrated, setAuth, clearAuth } = useAuthStore();

  const isEnabled = _hasHydrated && !!token;

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const data = await fetchMe(token!);
      if (data.user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 있는 계정으로 로그인해 주세요.');
      }
      return data;
    },
    enabled: isEnabled,
    retry: false,
  });

  const papersQuery = useQuery({
    queryKey: ['papers'],
    queryFn: () => fetchPapers(token!),
    enabled: isEnabled,
  });

  const examsQuery = useQuery({
    queryKey: ['exams'],
    queryFn: () => fetchExams(token!),
    enabled: isEnabled,
  });

  const subjectsQuery = useQuery({
    queryKey: ['subjects'],
    queryFn: () => fetchSubjects(token!),
    enabled: isEnabled,
  });

  React.useEffect(() => {
    if (!meQuery.isError) return;
    clearAuth();
    queryClient.clear();
    toast.error(
      meQuery.error instanceof Error
        ? meQuery.error.message
        : '세션이 만료되었습니다. 다시 로그인해 주세요.',
    );
  }, [meQuery.isError, meQuery.error, clearAuth, queryClient]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginValues) => login(email, password),
    onSuccess: (data) => {
      if (data.user.role !== 'ADMIN') {
        toast.error('관리자 권한이 있는 계정으로 로그인해 주세요.');
        return;
      }
      setAuth(data.accessToken, data.user);
      toast.success('로그인했습니다.');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : '로그인에 실패했습니다.',
      );
    },
  });

  const createPaperMutation = useMutation({
    mutationFn: (values: PaperValues) =>
      createPaper(token!, {
        title: values.title,
        year: values.year,
        examId: values.examId,
        subjectId: values.subjectId,
        questionCount: values.questionCount,
        isPublished: values.isPublished === 'true',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['papers'] });
      paperForm.reset({
        title: '',
        year: variables.year,
        examId: variables.examId,
        subjectId: variables.subjectId,
        questionCount: 20,
        isPublished: 'false',
      });
      toast.success('문제지를 생성했습니다.');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : '문제지 생성에 실패했습니다.',
      );
    },
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const paperForm = useForm<PaperValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      title: '',
      year: new Date().getFullYear(),
      examId: '',
      subjectId: '',
      questionCount: 20,
      isPublished: 'false',
    },
  });

  function handleLogout() {
    clearAuth();
    queryClient.clear();
    toast('로그아웃했습니다.');
  }

  function handleRefresh() {
    queryClient.invalidateQueries();
    toast.success('관리자 데이터를 불러왔습니다.');
  }

  const isBooting = !_hasHydrated || (isEnabled && meQuery.isLoading);
  const isLoadingData =
    papersQuery.isFetching ||
    examsQuery.isFetching ||
    subjectsQuery.isFetching ||
    meQuery.isFetching;

  const user = meQuery.data?.user ?? null;
  const papers = papersQuery.data?.papers ?? [];
  const exams = examsQuery.data?.exams ?? [];
  const subjects = subjectsQuery.data?.subjects ?? [];

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
              onSubmit={loginForm.handleSubmit((values) =>
                loginMutation.mutate(values),
              )}
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
                disabled={loginMutation.isPending}
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
              {user.email ?? user.nickname ?? '관리자'} 계정으로 접속 중
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingData}
            >
              <RefreshCw
                className={cn('size-4', isLoadingData && 'animate-spin')}
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
              onSubmit={paperForm.handleSubmit((values) =>
                createPaperMutation.mutate(values),
              )}
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
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                disabled={createPaperMutation.isPending}
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
                value={papers.filter((p) => p.isPublished).length}
              />
              <Metric
                label="문항"
                value={papers.reduce(
                  (sum, p) => sum + (p.registeredQuestionCount ?? 0),
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
                            variant={paper.isPublished ? 'default' : 'secondary'}
                          >
                            {paper.isPublished ? '공개' : '비공개'}
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

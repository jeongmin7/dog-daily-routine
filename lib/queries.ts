/* 서버 상태 계층 (TanStack Query).
   모든 강아지·기록·통계 fetch/mutation을 여기서 정의한다.
   - 클라 HTTP는 axios 컨벤션(signup·login과 동일).
   - API 응답 모양은 { data: ... } 래퍼 → res.data.data 로 꺼낸다.
   - mutation 성공 시 관련 쿼리를 invalidate 해서 캐시를 서버와 동기화. */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import axios from "axios";
import type {
  ApiToken,
  ApiTokenCreated,
  Disease,
  DogDisease,
  Dog,
  DogInput,
  DogRecord,
  DogStats,
  FeedAnalysis,
  Measurement,
  Medication,
  MedicationInput,
  Photo,
  RecordInput,
} from "./types";

/* ── 쿼리 키 팩토리 ──
   계층 구조(["dogs", id, "records"])라 상위 키 invalidate가 하위까지 무효화한다. */
export const qk = {
  dogs: ["dogs"] as const,
  dogsArchived: ["dogs", "archived"] as const,
  dog: (id: string) => ["dogs", id] as const,
  records: (dogId: string) => ["dogs", dogId, "records"] as const,
  stats: (dogId: string) => ["dogs", dogId, "stats"] as const,
  photos: (dogId: string) => ["dogs", dogId, "photos"] as const,
  feedAnalyses: (dogId: string) => ["dogs", dogId, "feed-analyses"] as const,
  medications: (dogId: string) => ["dogs", dogId, "medications"] as const,
  diseases: ["diseases"] as const,
  dogDiseases: (dogId: string) => ["dogs", dogId, "diseases"] as const,
  measurements: (dogId: string, metricKey: string) =>
    ["dogs", dogId, "measurements", metricKey] as const,
  tokens: ["tokens"] as const,
};

/* ── fetchers ── */
async function fetchDogs(): Promise<Dog[]> {
  const res = await axios.get("/api/dogs");
  return res.data?.data ?? [];
}
async function fetchArchivedDogs(): Promise<Dog[]> {
  const res = await axios.get("/api/dogs", { params: { archived: "true" } });
  return res.data?.data ?? [];
}
async function fetchDog(id: string): Promise<Dog> {
  const res = await axios.get(`/api/dogs/${id}`);
  return res.data.data;
}
async function fetchRecords(dogId: string): Promise<DogRecord[]> {
  const res = await axios.get(`/api/dogs/${dogId}/records`);
  return res.data?.data ?? [];
}
async function fetchStats(id: string): Promise<DogStats> {
  const res = await axios.get(`/api/dogs/${id}/stats`);
  return res.data.data;
}

/* ── 쿼리 훅 ── */
export function useDogs() {
  return useQuery({ queryKey: qk.dogs, queryFn: fetchDogs });
}

export function useArchivedDogs() {
  return useQuery({ queryKey: qk.dogsArchived, queryFn: fetchArchivedDogs });
}

export function useDog(id: string) {
  return useQuery({ queryKey: qk.dog(id), queryFn: () => fetchDog(id) });
}

export function useRecords(
  dogId: string,
  options?: Pick<UseQueryOptions<DogRecord[]>, "enabled">,
) {
  return useQuery({
    queryKey: qk.records(dogId),
    queryFn: () => fetchRecords(dogId),
    ...options,
  });
}

export function useDogStats(
  id: string,
  options?: Pick<UseQueryOptions<DogStats>, "enabled">,
) {
  return useQuery({
    queryKey: qk.stats(id),
    queryFn: () => fetchStats(id),
    ...options,
  });
}

/* ── mutation 훅 ── */
export function useAddDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dog: DogInput): Promise<Dog> => {
      const res = await axios.post("/api/dogs", dog);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dogs });
    },
  });
}

// 보관(archived:true) / 복원(archived:false) 토글.
export function useSetDogArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      archived,
    }: {
      id: string;
      archived: boolean;
    }): Promise<Dog> => {
      const res = await axios.patch(`/api/dogs/${id}`, { archived });
      return res.data.data;
    },
    onSuccess: (_data, { id }) => {
      // 활성 목록 ↔ 보관함 양쪽이 바뀌므로 둘 다 무효화.
      qc.invalidateQueries({ queryKey: qk.dogs });
      qc.removeQueries({ queryKey: qk.dog(id) });
    },
  });
}

export function useDeleteDog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/dogs/${id}`);
    },
    onSuccess: (_data, id) => {
      // 서버는 cascade로 강아지+기록을 지우므로 관련 캐시를 모두 무효화.
      qc.invalidateQueries({ queryKey: qk.dogs });
      qc.removeQueries({ queryKey: qk.dog(id) });
    },
  });
}

export function useAddRecord(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: RecordInput): Promise<DogRecord> => {
      const res = await axios.post(`/api/dogs/${dogId}/records`, rec);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.records(dogId) });
      qc.invalidateQueries({ queryKey: qk.stats(dogId) });
    },
  });
}

export function useUpdateRecord(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      rec,
    }: {
      recordId: string;
      rec: RecordInput;
    }): Promise<DogRecord> => {
      const res = await axios.patch(
        `/api/dogs/${dogId}/records/${recordId}`,
        rec,
      );
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.records(dogId) });
      qc.invalidateQueries({ queryKey: qk.stats(dogId) });
    },
  });
}

export function useDeleteRecord(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: string): Promise<void> => {
      await axios.delete(`/api/dogs/${dogId}/records/${recordId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.records(dogId) });
      qc.invalidateQueries({ queryKey: qk.stats(dogId) });
    },
  });
}

/* ── 사진 일지 ── */
export function usePhotos(dogId: string) {
  return useQuery({
    queryKey: qk.photos(dogId),
    queryFn: async (): Promise<Photo[]> => {
      const res = await axios.get(`/api/dogs/${dogId}/photos`);
      return res.data?.data ?? [];
    },
  });
}

export function useUploadPhoto(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData): Promise<Photo> => {
      // FormData를 주면 axios가 multipart 경계를 자동 설정.
      const res = await axios.post(`/api/dogs/${dogId}/photos`, form);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.photos(dogId) });
    },
  });
}

export function useDeletePhoto(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string): Promise<void> => {
      await axios.delete(`/api/dogs/${dogId}/photos/${photoId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.photos(dogId) });
    },
  });
}

/* ── 사료 분석 (MVP 3) ── */
export function useFeedAnalyses(dogId: string) {
  return useQuery({
    queryKey: qk.feedAnalyses(dogId),
    queryFn: async (): Promise<FeedAnalysis[]> => {
      const res = await axios.get(`/api/dogs/${dogId}/feed-analyses`);
      return res.data?.data ?? [];
    },
  });
}

export function useCreateFeedAnalysis(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<FeedAnalysis> => {
      const form = new FormData();
      form.set("file", file);
      // FormData를 주면 axios가 multipart 경계를 자동 설정.
      const res = await axios.post(`/api/dogs/${dogId}/feed-analyses`, form);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.feedAnalyses(dogId) });
    },
  });
}

export function useDeleteFeedAnalysis(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (analysisId: string): Promise<void> => {
      await axios.delete(`/api/dogs/${dogId}/feed-analyses/${analysisId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.feedAnalyses(dogId) });
    },
  });
}

/* ── 약 관리 ── */
export function useMedications(dogId: string) {
  return useQuery({
    queryKey: qk.medications(dogId),
    queryFn: async (): Promise<Medication[]> => {
      const res = await axios.get(`/api/dogs/${dogId}/medications`);
      return res.data?.data ?? [];
    },
  });
}

export function useAddMedication(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MedicationInput): Promise<Medication> => {
      const res = await axios.post(`/api/dogs/${dogId}/medications`, input);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medications(dogId) });
    },
  });
}

export function useDeleteMedication(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (medId: string): Promise<void> => {
      await axios.delete(`/api/dogs/${dogId}/medications/${medId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medications(dogId) });
    },
  });
}

// 오늘 슬롯 복용 체크/해제 토글.
export function useToggleDose(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      medId,
      time,
      taken,
    }: {
      medId: string;
      time: string;
      taken: boolean; // true=복용처리, false=취소
    }): Promise<void> => {
      const url = `/api/dogs/${dogId}/medications/${medId}/doses`;
      if (taken) await axios.post(url, { time });
      else await axios.delete(url, { data: { time } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medications(dogId) });
    },
  });
}

/* ── 지병 모니터링 ── */
export function useDiseaseCatalog() {
  return useQuery({
    queryKey: qk.diseases,
    queryFn: async (): Promise<Disease[]> => {
      const res = await axios.get("/api/diseases");
      return res.data?.data ?? [];
    },
  });
}

export function useDogDiseases(dogId: string) {
  return useQuery({
    queryKey: qk.dogDiseases(dogId),
    queryFn: async (): Promise<DogDisease[]> => {
      const res = await axios.get(`/api/dogs/${dogId}/diseases`);
      return res.data?.data ?? [];
    },
  });
}

export function useRegisterDisease(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (diseaseKey: string): Promise<void> => {
      await axios.post(`/api/dogs/${dogId}/diseases`, { diseaseKey });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dogDiseases(dogId) });
    },
  });
}

export function useUnregisterDisease(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (diseaseKey: string): Promise<void> => {
      await axios.delete(`/api/dogs/${dogId}/diseases/${diseaseKey}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dogDiseases(dogId) });
    },
  });
}

export function useMeasurements(dogId: string, metricKey: string) {
  return useQuery({
    queryKey: qk.measurements(dogId, metricKey),
    queryFn: async (): Promise<Measurement[]> => {
      const res = await axios.get(`/api/dogs/${dogId}/measurements`, {
        params: { metricKey },
      });
      return res.data?.data ?? [];
    },
  });
}

export function useAddMeasurement(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      metricKey,
      value,
    }: {
      metricKey: string;
      value: number;
    }): Promise<Measurement> => {
      const res = await axios.post(`/api/dogs/${dogId}/measurements`, {
        metricKey,
        value,
      });
      return res.data.data;
    },
    onSuccess: (_data, { metricKey }) => {
      qc.invalidateQueries({ queryKey: qk.measurements(dogId, metricKey) });
    },
  });
}

/* ── 개인 API 토큰 ── */
export function useApiTokens() {
  return useQuery({
    queryKey: qk.tokens,
    queryFn: async (): Promise<ApiToken[]> => {
      const res = await axios.get("/api/tokens");
      return res.data?.data ?? [];
    },
  });
}

export function useCreateApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<ApiTokenCreated> => {
      const res = await axios.post("/api/tokens", { name });
      return res.data.data; // 평문 token 포함(1회)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tokens });
    },
  });
}

export function useRevokeApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/tokens/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tokens });
    },
  });
}

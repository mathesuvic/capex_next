import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// >>> ADICIONE ESTA FUNÇÃO AO SEU ARQUIVO utils.ts <<<
export function normalizeLabel(input: string): string {
  return (input ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Usuário";
  return fullName.trim().split(" ")[0];
}

export function getRoleLabel(role: string): string {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}
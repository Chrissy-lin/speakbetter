import { BriefcaseBusiness, Coffee, GraduationCap, Presentation } from "lucide-react";

export type ScenarioId = "seminar" | "presentation" | "daily" | "interview";

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  prompt: string;
  goals: string[];
  iconName: "GraduationCap" | "Presentation" | "Coffee" | "BriefcaseBusiness";
};

export const scenarios: Scenario[] = [
  {
    id: "seminar",
    title: "University seminar",
    description: "Share opinions, ask questions, and respond politely in class.",
    prompt: "Your tutor asks: What do you think about group projects at university?",
    goals: ["Give one clear opinion", "Add a reason", "Invite another idea"],
    iconName: "GraduationCap"
  },
  {
    id: "presentation",
    title: "Presentation Q&A",
    description: "Answer follow-up questions after a short academic presentation.",
    prompt: "A classmate asks: Can you explain your main point again?",
    goals: ["Restate the idea simply", "Give one example", "Check understanding"],
    iconName: "Presentation"
  },
  {
    id: "daily",
    title: "Daily conversation",
    description: "Practise small talk for campus life, shops, and shared flats.",
    prompt: "Your flatmate asks: How was your day?",
    goals: ["Use natural small talk", "Ask one question back", "Use past tense"],
    iconName: "Coffee"
  },
  {
    id: "interview",
    title: "Job interview",
    description: "Build confidence for internships, part-time work, and placements.",
    prompt: "The interviewer asks: Why do you want this role?",
    goals: ["State motivation", "Mention a skill", "Sound confident but modest"],
    iconName: "BriefcaseBusiness"
  }
];

export const scenarioIcons = {
  GraduationCap,
  Presentation,
  Coffee,
  BriefcaseBusiness
};

export function getScenario(id: string | null): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

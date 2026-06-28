# SpeakBetter

A simple English speaking practice web app for international students.

## Features

- Practice scenarios for university seminars, presentation Q&A, daily conversation, and job interviews.
- Browser microphone recording with the MediaRecorder API and local audio playback.
- Speech-to-text transcription through the OpenAI API.
- AI tutor responses using simple B1-level English.
- Automatic coaching loop: recording, transcript, feedback, retry, and attempt tracking.
- Comparison view for original answer, suggested answer, and improvement attempt.
- Local improvement tracking for grammar, vocabulary, fluency score, and expression clarity.
- Coaching instruction plan with what to fix, what to practise next, and targeted drills.
- Micro practice mode with one short sentence to repeat or improve.
- Focus training for grammar, vocabulary, or sentence structure weakness.
- Progress story with today vs yesterday comparison and fluency trend.
- Lightweight learning memory in localStorage for recurring grammar errors, overused words, weak structures, and weak areas.
- Feedback panel with grammar corrections, better expression, useful vocabulary, and fluency score.
- Vocabulary notebook saved in browser local storage.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create `.env.local` before using transcription:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
OPENAI_TUTOR_MODEL=gpt-4.1-mini
```

## Current scope

This version includes real browser microphone recording, speech-to-text transcription, and AI tutor responses. The vocabulary notebook is still saved locally in the browser.

`POST /api/tutor` accepts:

```json
{
  "transcript": "Student transcript here",
  "scenarioId": "seminar"
}
```

It returns:

```json
{
  "grammar": [],
  "vocabulary": [],
  "natural_expression": [],
  "fluency_score": 8,
  "suggested_response": "",
  "follow_up_question": "Can you try again using my suggestions?",
  "coaching_plan": {
    "what_to_fix": [],
    "what_to_practice_next": "",
    "targeted_drills": []
  },
  "micro_practice": {
    "sentence": "",
    "instruction": ""
  },
  "focus_training": {
    "weakness": "sentence structure",
    "next_question": ""
  }
}
```

If `OPENAI_API_KEY` is missing, the route returns a mock tutor response.

The practice page also stores a local learning memory under `speakbetter:learning-memory`. This memory is browser-only and is used to send weak-area context to `/api/tutor` so future coaching can prioritise recurring mistakes.

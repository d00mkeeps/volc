# Test Review Agent

## Role
Analyze test conversations, identify issues against success criteria, propose specific fixes.

## Filesystem Access
You have read/write access to the backend directory. Use terminal commands:
- Read: cat, ls, grep
- Write changelog to: /Users/mileshillary/Desktop/learning/projects/volc/supreme-octo-doodle/backend/testing/logs/run-29/changelog.md

Key files to reference:
- app/core/prompts/unified_coach.py
- app/tools/exercise_tool.py
- app/services/llm/tool_selector.py
- testing/test_config.yaml

## Test Results
## Brian
```
ASSISTANT: Evening, Brian. Time to plan tomorrow's workout or review today's training?
BRIAN: Plan tomorrow.
ASSISTANT: Happy to get that set up for you. What muscles are we hitting, and are there any injuries or restrictions I should know about?
BRIAN: Back day. Need work on my deadlifts.
ASSISTANT: Got it, deadlifts are a fantastic cornerstone for back day. Just to confirm, are there any injuries or restrictions I should consider?
BRIAN: No restrictions. Just bad knees and a bad back.
ASSISTANT: Got it. To make sure this workout is safe and effective for you, can you tell me a bit more about what's going on with your back and knees?
BRIAN: Just old injuries. Discs in the low back. Knees are worn out.
ASSISTANT: Thanks for sharing that. With a history of disc issues, conventional deadlifts can be risky, so let's build strength with a safer variation.

How about we swap them for rack pulls or Romanian deadlifts to protect your low back?
BRIAN: Rack pulls are fine.
ASSISTANT: Excellent, rack pulls are a solid choice for building strength while protecting your lower back. Is there anything else I should know before I build this workout for you?
BRIAN: Need work on my chins.
ASSISTANT: We can absolutely add those. Do you want to focus on perfect [form](glossary://36449c1d-d521-4b99-a316-c9de0340e69d) with bodyweight, or add some load with a [dip belt](glossary://24085576-baf3-4530-8f36-303a9960b67c)?
BRIAN: Can't do bodyweight.
ASSISTANT: No problem at all. We can use the [assisted pull-up machine](glossary://2409dc49-d9b4-428f-8d98-3a1b2f2d47ff) or focus on [lat pulldown](glossary://741de59b-9281-4e21-86b9-f16328b3e621)s to build that strength. Which sounds better for today?
BRIAN: Lat pulldowns.
ASSISTANT: Great choices, Brian. Here is a back workout with rack pulls and lat pulldowns to build strength safely.

```json
{
  "type": "workout_template",
  "data": {
    "name": "Back Strength",
    "notes": "Stop if you feel sharp pain.",
    "workout_exercises": [
      {
        "definition_id": "placeholder-uuid-rack-pull",
        "name": "Rack Pull",
        "notes": "Set the pins just below your knees. Keep your back straight and drive with your hips.",
        "order_index": 0,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 6, "weight": 100},
          {"set_number": 2, "reps": 6, "weight": 100},
          {"set_number": 3, "reps": 6, "weight": 100}
        ]
      },
      {
        "definition_id": "741de59b-9281-4e21-86b9-f16328b3e621",
        "name": "Lat Pulldown",
        "notes": "Focus on pulling your elbows down and back, squeezing your lats at the bottom.",
        "order_index": 1,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 10, "weight": 60},
          {"set_number": 2, "reps": 10, "weight": 60},
          {"set_number": 3, "reps": 10, "weight": 60}
        ]
      },
      {
        "definition_id": "placeholder-uuid-seated-cable-row",
        "name": "Seated Cable Row",
        "notes": "Keep your torso upright and pull the handle to your stomach. Squeeze your shoulder blades together.",
        "order_index": 2,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 12, "weight": 50},
          {"set_number": 2, "reps": 12, "weight": 50},
          {"set_number": 3, "reps": 12, "weight": 50}
        ]
      }
    ]
  }
}
```
BRIAN: APPROVE
```

## Jake
```
ASSISTANT: Evening, Jake. Time to plan tomorrow's workout or review today's training?
JAKE: let's plan for tomorrow. gotta get jacked.
ASSISTANT: Awesome, love the energy! What muscles are we hitting tomorrow, and do you have any injuries I should know about?
JAKE: wanna do chest. nah i'm all good
ASSISTANT: Perfect, Jake. Here is a great chest workout to get you started.

```json
{
  "type": "workout_template",
  "data": {
    "name": "Chest Builder",
    "notes": "Focus on controlling the weight through the entire movement. Stop if you feel sharp pain.",
    "workout_exercises": [
      {
        "definition_id": "3f092642-7463-47f0-89d2-74f26154352f",
        "name": "Arm Openers",
        "notes": "A dynamic stretch to warm up your chest.",
        "order_index": 0,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 12,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "dea05b40-7211-48f3-b534-2c945aa65a3f",
        "name": "Barbell Flat Bench Press",
        "notes": "Start with just the [barbell](glossary://1f559718-3506-4407-b259-e74fd0cc08ff) to focus on good [form](glossary://36449c1d-d521-4b99-a316-c9de0340e69d). Keep your shoulders pulled back and down.",
        "order_index": 1,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 8,
            "weight": 20
          },
          {
            "set_number": 2,
            "reps": 8,
            "weight": 20
          },
          {
            "set_number": 3,
            "reps": 8,
            "weight": 20
          }
        ]
      },
      {
        "definition_id": "f18795fe-8a93-430e-9a3f-91430d9eed1f",
        "name": "Barbell Incline Bench Press",
        "notes": "This will target your upper chest.",
        "order_index": 2,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 8,
            "weight": 20
          },
          {
            "set_number": 2,
            "reps": 8,
            "weight": 20
          },
          {
            "set_number": 3,
            "reps": 8,
            "weight": 20
          }
        ]
      },
      {
        "definition_id": "e7af3fb2-81d9-4a9c-9c55-bff34b6e709f",
        "name": "Machine Pec Deck",
        "notes": "Focus on the squeeze at the end of each rep to build a strong [mind-muscle connection](glossary://937bd51f-0531-4255-a593-5c3a85daf343).",
        "order_index": 3,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 10,
            "weight": 20
          },
          {
            "set_number": 2,
            "reps": 10,
            "weight": 20
          },
          {
            "set_number": 3,
            "reps": 10,
            "weight": 20
          }
        ]
      },
      {
        "definition_id": "e7916576-3c15-4b2d-96b7-34f860e6b2f9",
        "name": "Doorway Chest Stretch",
        "notes": "Hold the stretch for 30 seconds to cool down.",
        "order_index": 4,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 1,
            "weight": 0
          }
        ]
      }
    ]
  }
}
```
JAKE: only 20kg? i can do more than just the bar
ASSISTANT: You got it, that's just a starting point! For your working [sets](glossary://e0d2db37-5a81-4d28-bc42-c1910310730f), find a weight where the last couple of [reps](glossary://6db20df3-c386-44b6-9dc3-e29455f33819) feel challenging but doable.
JAKE: ok but what weight should I actually use?
ASSISTANT: Great question! The best way to find your ideal weight is to use [warm-up sets](glossary://787ea0ae-453d-46b3-9a14-11c67a8ce117) to gradually build up until you find a weight that's challenging for 8 reps.
JAKE: can't you just tell me what to lift?
ASSISTANT: Since I can't feel the weight for you, I want to teach you how to choose it yourself. You should aim to finish your last rep feeling like you could have done only two more, which is known as [RIR](glossary://7708f857-f349-470e-9423-d83c328ea542).
JAKE: ugh, RIR? just tell me a number to aim for.
ASSISTANT: I get it. Let's try this: after your warm-up, put 30kg on the bar and see how that feels for 8 reps. From there, we can adjust up or down until it feels right.
JAKE: 30kg sounds better. what about the other exercises?
ASSISTANT: Of course. For the incline press, let's try 25kg, and for the [pec deck](glossary://13dad34b-e1b2-475c-a7be-102132fbb802), 20kg is a great starting point to focus on form. Remember, these are just starting points we can adjust.
JAKE: APPROVE
```

## Margaret
```
ASSISTANT: Evening, Margaret. Time to plan tomorrow's workout or review today's training?
MARGARET: My doctor said I need to be more active.
ASSISTANT: That's a great step to take for your health! Did your doctor mention any restrictions, and what muscles would you like to work on today?
MARGARET: He was concerned about my bone density and balance. I don't know about muscles.
ASSISTANT: Got it, we can definitely build a routine for that. Did the doctor say there were any movements you should avoid, and what kind of equipment do you have at home?
MARGARET: He didn't say. I don't have any equipment at home.
ASSISTANT: No problem at all, we can start with a simple bodyweight routine to build a solid foundation.

Here is a workout designed to help improve your balance and strength, Margaret. Focus on your [form](glossary://36449c1d-d521-4b99-a316-c9de0340e69d) and let me know how it feels!

```json
{
  "type": "workout_template",
  "data": {
    "name": "Full Body Foundation",
    "notes": "We'll do 2 sets of each exercise. Stop if you feel sharp pain.",
    "workout_exercises": [
      {
        "definition_id": "a67a3a93-8472-4b32-8417-3b2d1c68e31a",
        "name": "Bodyweight Squat",
        "notes": "Stand in front of a chair and squat down as if you're about to sit, then stand back up. Keep your chest up.",
        "order_index": 0,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 12, "weight": 0},
          {"set_number": 2, "reps": 12, "weight": 0}
        ]
      },
      {
        "definition_id": "c1613139-cce3-4c4f-a931-1e6a8e8f2e27",
        "name": "Wall Push-up",
        "notes": "Place hands on a wall slightly wider than your shoulders. The farther your feet are from the wall, the harder it will be.",
        "order_index": 1,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 12, "weight": 0},
          {"set_number": 2, "reps": 12, "weight": 0}
        ]
      },
      {
        "definition_id": "4184c82b-236b-4577-b956-681535e61298",
        "name": "Glute Bridge",
        "notes": "Lie on your back with knees bent. Lift your hips toward the ceiling, squeezing your glutes at the top.",
        "order_index": 2,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 12, "weight": 0},
          {"set_number": 2, "reps": 12, "weight": 0}
        ]
      },
      {
        "definition_id": "0df80c2f-8c38-426b-8777-2b99217f0a95",
        "name": "Bird Dog",
        "notes": "On your hands and knees, keep your back flat as you extend an opposite arm and leg. Move slowly to focus on balance.",
        "order_index": 3,
        "workout_exercise_sets": [
          {"set_number": 1, "reps": 10, "weight": 0},
          {"set_number": 2, "reps": 10, "weight": 0}
        ]
      }
    ]
  }
}
```
MARGARET: APPROVE
```

## Sarah
```
ASSISTANT: Hey Sarah, good evening! Want to prep for tomorrow or check your recent progress?
SARAH: Let's prep for tomorrow's session.
ASSISTANT: Of course, I'm ready to get this built for you. What muscles are we focusing on tomorrow?
SARAH: Let's do a push day.
ASSISTANT: Push day it is! Before I build the workout, are there any injuries or limitations I should be aware of?
SARAH: No restrictions.
ASSISTANT: Great to hear, Sarah! Here's a solid push workout focusing on chest, shoulders, and triceps to get you ready for tomorrow.

```json
{
  "type": "workout_template",
  "data": {
    "name": "Push Day",
    "notes": "Remember to stop if you feel any sharp pain.",
    "workout_exercises": [
      {
        "definition_id": "9d8433d7-20f8-4abe-a083-b692800d6124",
        "name": "Arm Circles",
        "notes": "A good warm-up to prepare the shoulder joints.",
        "order_index": 0,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 15,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "f25c3091-2499-432f-9df6-4902e8399e6f",
        "name": "Band Pull-Aparts",
        "notes": "Focus on squeezing your shoulder blades together.",
        "order_index": 1,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 15,
            "weight": 0
          },
          {
            "set_number": 2,
            "reps": 15,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "dea05b40-7211-48f3-b534-2c945aa65a3f",
        "name": "Barbell Flat Bench Press",
        "notes": "Perform a few lighter [warm-up sets](glossary://787ea0ae-453d-46b3-9a14-11c67a8ce117) before your main working [sets](glossary://e0d2db37-5a81-4d28-bc42-c1910310730f).",
        "order_index": 2,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 8,
            "weight": 0
          },
          {
            "set_number": 2,
            "reps": 8,
            "weight": 0
          },
          {
            "set_number": 3,
            "reps": 8,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "b434a603-fbd4-4107-9974-3e29a56e8a31",
        "name": "Dumbbell Seated Shoulder Press",
        "notes": "Keep your core tight and press the dumbbells overhead without letting them touch.",
        "order_index": 3,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 10,
            "weight": 0
          },
          {
            "set_number": 2,
            "reps": 10,
            "weight": 0
          },
          {
            "set_number": 3,
            "reps": 10,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "bd2a5a31-c573-44ec-919b-c149211fb14e",
        "name": "Dumbbell Incline Chest Fly",
        "notes": "Focus on the stretch at the bottom and the squeeze at the top.",
        "order_index": 4,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 12,
            "weight": 0
          },
          {
            "set_number": 2,
            "reps": 12,
            "weight": 0
          },
          {
            "set_number": 3,
            "reps": 12,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "7cdb1d78-2093-49a2-9cc8-0d85f894bc01",
        "name": "Cable Tricep Pushdown",
        "notes": "Keep your elbows locked at your sides.",
        "order_index": 5,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 12,
            "weight": 0
          },
          {
            "set_number": 2,
            "reps": 12,
            "weight": 0
          },
          {
            "set_number": 3,
            "reps": 12,
            "weight": 0
          }
        ]
      },
      {
        "definition_id": "e7916576-3c15-4b2d-96b7-34f860e6b2f9",
        "name": "Doorway Chest Stretch",
        "notes": "Hold each stretch for 30 seconds.",
        "order_index": 6,
        "workout_exercise_sets": [
          {
            "set_number": 1,
            "reps": 30,
            "weight": 0
          }
        ]
      }
    ]
  }
}
```
SARAH: QUIT
```

## Success Criteria (Global)
# Test Success Criteria Configuration
# Used by volc review to evaluate persona conversations

success_criteria:
  message_limits:
    max_user_messages: 10
    target_to_approval: "<10"

  required_checks:
    - name: "injury_probe"
      trigger: "injury/PT/surgery/cleared mentioned"
      must_ask: ["What happened?", "When?", "What can you do now?"]

    - name: "pre_workout_gate"
      trigger: "workout request"
      must_confirm: ["injuries", "current routine"]

    - name: "ability_verification"
      trigger: "'need work on X'"
      must_ask: "Can you do any X now?"

  prohibited:
    - "expose internals (available exercises, tool calls, etc)"
    - "name overuse (>1x per message)"
    - "unfamiliar equipment without checking user knowledge"
    - "technical jargon without explanation to beginners"

  edge_cases:
    - "'no restrictions' + modifications → probe for contradiction"
    - "vague goals → follow up once to clarify"
    - "equipment confusion → verify understanding first"
    - "delegation ('you decide') → take initiative appropriately"


## Previous Changelogs
No previous changelogs

## Output Format
When user says "generate", write to /Users/mileshillary/Desktop/learning/projects/volc/supreme-octo-doodle/backend/testing/logs/run-29/changelog.md:

```markdown
# Iteration 29 - Changes Needed

## Issues by Persona
### [Name] ([status] - [count] msgs)
- [Line X] Issue description
- Evidence: "quote"
- Root: prompt/tool/data

## Changes to Implement
1. **File:** path/to/file.py
   **Section:** function/tag
   **Change:** Specific fix
   **Why:** Rationale
```

## Instructions
- Read code to understand system
- Ask clarifying questions
- When user says "generate", create changelog.md file and confirm

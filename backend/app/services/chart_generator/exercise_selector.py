from typing import Dict, List
from pydantic import BaseModel, Field

class ExerciseSelection(BaseModel):
    """Selected exercises from available data based on user query."""
    exercises: List[str] = Field(description="Names of exercises relevant to the query")
    reasoning: str = Field(description="Explanation of why these exercises were selected")

class DefinitionBasedSelector:
    """
    Selects exercises based on definition attributes without LLM.
    Uses definition_id to group and select exercises.
    """
    def __init__(self):
        self.movement_patterns = [
            'push', 'pull', 'squat', 'hinge', 'carry', 'core', 'rotation'
        ]
        self.muscle_groups = [
            'chest', 'back', 'shoulders', 'triceps', 'biceps', 'legs', 
            'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'core'
        ]
    
    def select_exercises(self, query: str, available_exercises: List[Dict]) -> List[str]:
        """
        Select relevant exercises based on query keywords.
        Groups by definition_id to avoid duplicates.
        """
        query = query.lower()
        
        # Process exercises with definitions first (group by definition_id)
        definition_groups = {}
        undefined_exercises = []
        
        for exercise in available_exercises:
            definition_id = exercise.get('definition_id')
            name = exercise.get('exercise_name', '')
            
            if definition_id:
                key = str(definition_id)
                if key not in definition_groups:
                    definition_groups[key] = []
                definition_groups[key].append(exercise)
            else:
                undefined_exercises.append(exercise)
        
        # Extract query intent (pattern-based)
        query_intents = self._extract_query_intent(query)
        
        # Select exercises based on intent
        selected_exercises = []
        
        # Process defined exercises first (one per definition)
        for key, exercises in definition_groups.items():
            # Use the first exercise as representative
            exercise = exercises[0]
            name = exercise.get('exercise_name', '')
            
            # Check if this matches any of our intents
            if self._matches_intent(exercise, query_intents):
                selected_exercises.append(name)
        
        # Process any undefined exercises
        for exercise in undefined_exercises:
            name = exercise.get('exercise_name', '').lower()
            
            # Basic keyword matching for undefined exercises
            if any(keyword in name for keyword in query_intents['keywords']):
                selected_exercises.append(exercise.get('exercise_name', ''))
        
        # If nothing was selected, return exercises with explicit name matches
        if not selected_exercises:
            explicit_matches = []
            for exercise in available_exercises:
                name = exercise.get('exercise_name', '').lower()
                if name in query or query in name:
                    explicit_matches.append(exercise.get('exercise_name', ''))
            
            # Remove duplicates (preserving order)
            seen = set()
            unique_matches = [x for x in explicit_matches if not (x in seen or seen.add(x))]
            return unique_matches[:5]  # Limit to 5 exercises
            
        return selected_exercises
    
    def _extract_query_intent(self, query: str) -> Dict:
        """Extract the intent of the query into components."""
        intent = {
            'patterns': [],  # Movement patterns
            'muscles': [],   # Muscle groups
            'keywords': [],  # Generic keywords
            'specific_exercises': []  # Explicitly mentioned exercises
        }
        
        # Check for movement patterns
        for pattern in self.movement_patterns:
            if pattern in query:
                intent['patterns'].append(pattern)
                intent['keywords'].append(pattern)
        
        # Check for muscle groups
        for muscle in self.muscle_groups:
            if muscle in query:
                intent['muscles'].append(muscle)
                intent['keywords'].append(muscle)
        
        # Check for specific exercise types
        specific_exercises = [
            'bench press', 'squat', 'deadlift', 'shoulder press', 'overhead press',
            'pull up', 'push up', 'row', 'curl', 'extension', 'lunge', 'dip',
            'face pull', 'lat pulldown', 'leg press'
        ]
        
        for exercise in specific_exercises:
            if exercise in query:
                intent['specific_exercises'].append(exercise)
                intent['keywords'].append(exercise)
        
        # Add other relevant keywords
        if 'strength' in query or 'stronger' in query:
            intent['keywords'].append('strength')
        
        if 'progress' in query or 'improvement' in query:
            intent['keywords'].append('progress')
            
        return intent
    
    def _matches_intent(self, exercise: Dict, intent: Dict) -> bool:
        """Check if an exercise matches the query intent."""
        # Get exercise attributes
        name = exercise.get('exercise_name', '').lower()
        movement_pattern = exercise.get('movement_pattern', '').lower()
        primary_muscles = [m.lower() for m in exercise.get('primary_muscles', [])]
        
        # Check for specific exercise matches first
        for specific in intent['specific_exercises']:
            if specific in name:
                return True
        
        # Check for movement pattern matches
        if movement_pattern and any(pattern in movement_pattern for pattern in intent['patterns']):
            return True
        
        # Check for muscle group matches
        if primary_muscles and any(muscle in primary_muscles for muscle in intent['muscles']):
            return True
        
        # Check for generic keyword matches in name
        if any(keyword in name for keyword in intent['keywords']):
            return True
            
        return False
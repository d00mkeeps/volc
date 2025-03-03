from typing import List, Tuple, Any
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.utils.function_calling import tool_example_to_messages
from app.core.prompts.onboarding_extractor import SYSTEM_PROMPT
import logging

from app.schemas.onboarding_summary import UserOnboarding, PersonalInfo, FitnessBackground
from .base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class OnboardingExtractor(BaseExtractor[UserOnboarding]):
    def __init__(self, model: str = "claude-3-7-sonnet-20250219") -> None:
        """
        Initialize the OnboardingExtractor with a specified model.
        """
        try:
            self.extract_model = ChatAnthropic(
                model=model
            ).with_structured_output(UserOnboarding)
            
            self.example_messages = self._create_example_messages()
            
        except Exception as e:
            logger.error(f"Failed to initialize OnboardingExtractor: {str(e)}")
            raise

    def _create_example_messages(self) -> List[Any]:
        """
        Creates example messages using LangChain's tool example format.
        """
        try:
            messages = []
            examples = self._get_extraction_examples()
            
            for text, output in examples:
                formatted_messages = tool_example_to_messages(text, [output])
                messages.extend(formatted_messages)
                
            return messages
            
        except Exception as e:
            logger.error(f"Failed to create example messages: {str(e)}")
            raise

    def _get_extraction_examples(self) -> List[Tuple[str, UserOnboarding]]:
        """
        Defines example conversations and their expected structured outputs.
        Examples demonstrate gradual information gathering and partial data states.
        """
        try:
            return [
                # Example 1: Initial introduction with just name
                (
                    "Hi, I'm John Smith.",
                    UserOnboarding(
                        personalInfo=PersonalInfo(
                            firstName="John",
                            lastName="Smith"
                            # All other fields remain None
                        ),
                        goal=None,
                        fitnessBackground=FitnessBackground()
                    )
                ),
                # Example 2: More details but still partial
                (
                    "I've been training for about 2 years, mostly powerlifting. "
                    "I prefer using metric measurements.",
                    UserOnboarding(
                        personalInfo=PersonalInfo(
                            preferredUnits="metric"
                            # Other personal info fields remain None
                        ),
                        goal=None,
                        fitnessBackground=FitnessBackground(
                            trainingAge="2 years",
                            exercisePreferences=["powerlifting"]
                            # Abilities and injuries remain None
                        )
                    )
                ),
                # Example 3: Complete information
                (
                    "My name is Jane Doe, I go by Jane. I'm in the 25-35 age group "
                    "and prefer metric units. My goal is to run a marathon in 6 months. "
                    "I've been running for 1 year, currently doing 10km runs. "
                    "No injuries to report.",
                    UserOnboarding(
                        personalInfo=PersonalInfo(
                            firstName="Jane",
                            lastName="Doe",
                            ageGroup="25-35",
                            preferredUnits="metric"
                        ),
                        goal="run a marathon in 6 months",
                        fitnessBackground=FitnessBackground(
                            trainingAge="1 year",
                            exercisePreferences=["running"],
                            currentAbilities=["10km runs"],
                            injuries=[]
                        )
                    )
                ),
                (
                "Hi, I want to increase my total by 50kg. Currently doing powerlifting.",
                UserOnboarding(
                    personalInfo=PersonalInfo(
                        preferredUnits="metric"  # Inferred from kg usage
                    ),
                    goal="increase total by 50kg",
                    fitnessBackground=FitnessBackground(
                        exercisePreferences=["powerlifting"]
                    )
                )
            ),
(
    "I have no injuries but I'm recovering from hernia surgery. ",
    UserOnboarding(
        personalInfo=PersonalInfo(),  # Add required field
        fitnessBackground=FitnessBackground(
            injuries=["recovering from hernia surgery"]
        )
    )
),

            # Example 5: Metric preference inference from abilities
            (
                "My current lifts are: squat 140kg, bench 100kg, deadlift 180kg.",
                UserOnboarding(
                    personalInfo=PersonalInfo(
                        preferredUnits="metric"  # Inferred from consistent kg usage
                    ),
                    fitnessBackground=FitnessBackground(
                        currentAbilities=[
                            "Squat 140kg",
                            "Bench 100kg",
                            "Deadlift 180kg"
                        ]
                    )
                )
            )
            ]
        except Exception as e:
            logger.error(f"Failed to create extraction examples: {str(e)}")
            raise

    async def extract(self, conversation: List[HumanMessage | AIMessage]) -> UserOnboarding:
        """
        Extracts structured information from the conversation history.
        Handles partial information and maintains None for unknown fields.
        """
        conversation_text = self._format_conversation(conversation)
        
        messages = self.example_messages + [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=conversation_text)
        ]
        
        try:
            return await self.extract_model.ainvoke(messages)
        except Exception as e:
            logger.error(f"Extraction failed: {str(e)}")
            # Return a fresh UserOnboarding instance with all fields None
            return UserOnboarding(
                personalInfo=PersonalInfo(),
                goal=None,
                fitnessBackground=FitnessBackground()
            )
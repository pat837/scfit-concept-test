from pydantic import BaseModel, Field, field_validator


USC_AFFILIATIONS = ["Yes, undergraduate student", "Yes, graduate student", "Yes, other USC affiliation", "No"]
FITNESS_INTERESTS = ["Gym/strength training", "Running or jogging", "Walking", "Group fitness classes", "Yoga or Pilates", "Recreational sports", "Cycling", "Swimming", "Dance", "Other"]
FITNESS_CHALLENGES = ["I do not know what fitness opportunities are available", "Fitness information is spread across different places", "I do not have someone to participate with", "I feel uncomfortable joining alone", "Available activities do not fit my schedule", "Locations are inconvenient", "Cost", "Lack of motivation", "I prefer exercising alone", "Nothing currently prevents me", "Other"]
FEATURES = ["Discovering gyms and workout locations", "Discovering fitness events and activities", "Browsing students with similar fitness interests", "Connecting with another student to work out", "Finding run clubs or group activities", "None of these"]
ACTIONS = ["Explore a fitness location", "View another student’s profile", "Reach out to another student", "Join a run club", "Join a group fitness activity", "I would browse but probably not take an action", "I would not use the platform"]
ADOPTION_BARRIERS = ["Privacy or safety concerns", "I would not feel comfortable contacting students I do not know", "I prefer finding activities through existing USC resources", "I prefer exercising alone", "I would be concerned about inactive or inaccurate profiles", "I would need more information before using it", "The platform does not offer the activities I want", "Nothing would prevent me", "Other"]
LIKELIHOODS = ["Very unlikely", "Unlikely", "Unsure", "Likely", "Very likely"]
INITIAL_TESTING_INTEREST = ["Yes, I’d be interested", "Maybe", "Not right now"]


class SessionRequest(BaseModel):
    session_id: str | None = None


class EventRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=36)


class SurveySubmission(BaseModel):
    session_id: str = Field(min_length=1, max_length=36)
    participant_name: str = Field(min_length=1, max_length=200)
    major_program: str = Field(min_length=1, max_length=200)
    college_school: str = Field(min_length=1, max_length=200)
    initial_product_testing_interest: str
    usc_affiliation: str
    fitness_interests: list[str] = Field(min_length=1, max_length=3)
    fitness_interests_other: str | None = Field(default=None, max_length=1000)
    participation_barriers: list[str] = Field(min_length=1, max_length=2)
    participation_barriers_other: str | None = Field(default=None, max_length=1000)
    most_valuable_feature: str
    likely_action: str
    adoption_barriers: list[str] = Field(min_length=1)
    next_month_likelihood: str
    overall_reaction: str | None = Field(default=None, max_length=5000)

    @field_validator("participant_name", "major_program", "college_school")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required.")
        return value

    @field_validator("initial_product_testing_interest")
    @classmethod
    def validate_initial_interest(cls, value: str) -> str:
        return _one_of(value, INITIAL_TESTING_INTEREST)

    @field_validator("usc_affiliation")
    @classmethod
    def validate_affiliation(cls, value: str) -> str:
        return _one_of(value, USC_AFFILIATIONS)

    @field_validator("most_valuable_feature")
    @classmethod
    def validate_feature(cls, value: str) -> str:
        return _one_of(value, FEATURES)

    @field_validator("likely_action")
    @classmethod
    def validate_action(cls, value: str) -> str:
        return _one_of(value, ACTIONS)

    @field_validator("next_month_likelihood")
    @classmethod
    def validate_likelihood(cls, value: str) -> str:
        return _one_of(value, LIKELIHOODS)

    @field_validator("fitness_interests")
    @classmethod
    def validate_fitness_interests(cls, values: list[str]) -> list[str]:
        return _many_of(values, FITNESS_INTERESTS)

    @field_validator("participation_barriers")
    @classmethod
    def validate_participation_barriers(cls, values: list[str]) -> list[str]:
        return _many_of(values, FITNESS_CHALLENGES)

    @field_validator("adoption_barriers")
    @classmethod
    def validate_adoption_barriers(cls, values: list[str]) -> list[str]:
        return _many_of(values, ADOPTION_BARRIERS)


def _one_of(value: str, choices: list[str]) -> str:
    if value not in choices:
        raise ValueError("Select a valid option.")
    return value


def _many_of(values: list[str], choices: list[str]) -> list[str]:
    if any(value not in choices for value in values):
        raise ValueError("One or more selections are invalid.")
    return values
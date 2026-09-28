from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


USC_AFFILIATIONS = ["Yes, undergraduate student", "Yes, graduate student", "Yes, other USC affiliation", "No"]
FREQUENCIES = ["Five or more times per week", "Three to four times per week", "One to two times per week", "Less than once per week", "I do not currently participate"]
FITNESS_INTERESTS = ["Gym/strength training", "Running or jogging", "Walking", "Group fitness classes", "Yoga or Pilates", "Recreational sports", "Cycling", "Swimming", "Dance", "Other", "I am not currently interested in a fitness activity"]
DIFFICULTY = ["Very difficult", "Difficult", "Neither easy nor difficult", "Easy", "Very easy"]
PARTNER_DIFFICULTY = DIFFICULTY + ["I prefer exercising alone"]
PARTICIPATION_BARRIERS = ["I do not know what fitness opportunities are available", "Fitness information is spread across different places", "I do not have someone to participate with", "I feel uncomfortable joining alone", "Available activities do not fit my schedule", "Locations are inconvenient", "Cost", "Lack of motivation", "I prefer exercising alone", "Nothing currently prevents me", "Other"]
DISCOVERY_METHODS = ["Friends or classmates", "USC websites", "USC student organizations", "Instagram or other social media", "Group chats", "Fitness applications", "Posters or campus events", "Online search", "I do not currently search for these opportunities", "Other"]
PROTOTYPE_SECTIONS = ["Fitness locations/opportunities", "Student fitness profiles", "Run clubs or group activities", "Individual student profile", "Individual activity details", "I did not explore the prototype"]
FEATURES = ["Discovering gyms and workout locations", "Discovering fitness events and activities", "Browsing students with similar fitness interests", "Connecting with another student to work out", "Finding run clubs or group activities", "None of these"]
ACTIONS = ["Explore a fitness location", "View another student’s profile", "Reach out to another student", "Join a run club", "Join a group fitness activity", "I would browse but probably not take an action", "I would not use the platform"]
COMMUNITY_VALUES = ["Not at all valuable", "Slightly valuable", "Moderately valuable", "Very valuable", "Extremely valuable"]
LIKELIHOODS = ["Very unlikely", "Unlikely", "Unsure", "Likely", "Very likely"]
ADOPTION_BARRIERS = ["Privacy or safety concerns", "I would not feel comfortable contacting students I do not know", "I prefer finding activities through existing USC resources", "I prefer exercising alone", "I would be concerned about inactive or inaccurate profiles", "I would need more information before using it", "The platform does not offer the activities I want", "Nothing would prevent me", "Other"]
FUTURE_INTEREST = ["Yes, I would like to participate", "Maybe — send me more information", "No"]
FUTURE_EXPERIENCES = ["Finding a workout partner", "Joining a run club", "Joining a group workout", "Discovering fitness locations", "Discovering fitness activities and events", "Other"]


class SessionRequest(BaseModel):
    session_id: str | None = None


class EventRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=36)


class SurveySubmission(BaseModel):
    session_id: str = Field(min_length=1, max_length=36)
    participant_name: str = Field(min_length=1, max_length=200)
    major_program: str = Field(min_length=1, max_length=200)
    college_school: str = Field(min_length=1, max_length=200)
    usc_affiliation: str
    fitness_frequency: str
    fitness_interests: list[str] = Field(min_length=1)
    fitness_interests_other: str | None = Field(default=None, max_length=1000)
    opportunity_difficulty: str
    partner_difficulty: str
    participation_barriers: list[str] = Field(default_factory=list)
    participation_barriers_other: str | None = Field(default=None, max_length=1000)
    discovery_methods: list[str] = Field(min_length=1)
    discovery_methods_other: str | None = Field(default=None, max_length=1000)
    prototype_sections_explored: list[str] = Field(min_length=1)
    most_valuable_feature: str
    likely_action: str
    community_value: str
    next_month_likelihood: str
    adoption_barriers: list[str] = Field(default_factory=list)
    adoption_barriers_other: str | None = Field(default=None, max_length=1000)
    overall_reaction: str | None = Field(default=None, max_length=5000)
    future_test_interest: str
    email: EmailStr | None = None
    preferred_future_experience: str
    preferred_future_experience_other: str | None = Field(default=None, max_length=1000)

    @field_validator("usc_affiliation")
    @classmethod
    def validate_affiliation(cls, value: str) -> str:
        return _one_of(value, USC_AFFILIATIONS)

    @field_validator("fitness_frequency")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        return _one_of(value, FREQUENCIES)

    @field_validator("opportunity_difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        return _one_of(value, DIFFICULTY)

    @field_validator("partner_difficulty")
    @classmethod
    def validate_partner_difficulty(cls, value: str) -> str:
        return _one_of(value, PARTNER_DIFFICULTY)

    @field_validator("most_valuable_feature")
    @classmethod
    def validate_feature(cls, value: str) -> str:
        return _one_of(value, FEATURES)

    @field_validator("likely_action")
    @classmethod
    def validate_action(cls, value: str) -> str:
        return _one_of(value, ACTIONS)

    @field_validator("community_value")
    @classmethod
    def validate_community_value(cls, value: str) -> str:
        return _one_of(value, COMMUNITY_VALUES)

    @field_validator("next_month_likelihood")
    @classmethod
    def validate_likelihood(cls, value: str) -> str:
        return _one_of(value, LIKELIHOODS)

    @field_validator("future_test_interest")
    @classmethod
    def validate_future_interest(cls, value: str) -> str:
        return _one_of(value, FUTURE_INTEREST)

    @field_validator("preferred_future_experience")
    @classmethod
    def validate_future_experience(cls, value: str) -> str:
        return _one_of(value, FUTURE_EXPERIENCES)

    @field_validator("fitness_interests")
    @classmethod
    def validate_fitness_interests(cls, values: list[str]) -> list[str]:
        return _many_of(values, FITNESS_INTERESTS)

    @field_validator("participation_barriers")
    @classmethod
    def validate_participation_barriers(cls, values: list[str]) -> list[str]:
        return _many_of(values, PARTICIPATION_BARRIERS)

    @field_validator("discovery_methods")
    @classmethod
    def validate_discovery_methods(cls, values: list[str]) -> list[str]:
        return _many_of(values, DISCOVERY_METHODS)

    @field_validator("prototype_sections_explored")
    @classmethod
    def validate_sections(cls, values: list[str]) -> list[str]:
        return _many_of(values, PROTOTYPE_SECTIONS)

    @field_validator("adoption_barriers")
    @classmethod
    def validate_adoption_barriers(cls, values: list[str]) -> list[str]:
        return _many_of(values, ADOPTION_BARRIERS)

    @model_validator(mode="after")
    def validate_exclusive_choices(self):
        _exclusive(self.fitness_interests, "I am not currently interested in a fitness activity")
        _exclusive(self.participation_barriers, "Nothing currently prevents me")
        _exclusive(self.adoption_barriers, "Nothing would prevent me")
        _exclusive(self.prototype_sections_explored, "I did not explore the prototype")
        return self


def _one_of(value: str, choices: list[str]) -> str:
    if value not in choices:
        raise ValueError("Select a valid option.")
    return value


def _many_of(values: list[str], choices: list[str]) -> list[str]:
    if any(value not in choices for value in values):
        raise ValueError("One or more selections are invalid.")
    return values


def _exclusive(values: list[str], exclusive_choice: str) -> None:
    if exclusive_choice in values and len(values) > 1:
        raise ValueError(f"{exclusive_choice} cannot be combined with other selections.")
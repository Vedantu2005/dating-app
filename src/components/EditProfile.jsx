import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Pencil,
  ChevronRight,
  Plus,
  Lock,
  Check,
  Heart,
  Star,
  Zap,
  Flame,
  X,
  User, // We use User instead of UserSquare
  LogOut,
  Loader,
  Briefcase,
  MapPin,
  MessageCircle,
  Camera,
  Upload,
  Ruler,
  BookOpen,
  Users,
  MessageSquare,
  GlassWater,
  Cigarette,
  Dumbbell,
  Utensils,
  Moon,
  Cat,
  Sprout,
  Music,
  EyeOff,
  School,
  Building,
  Mic,
  ListMusic,
  GraduationCap,
  ArrowLeft,
  // UserSquare, // ❌ REMOVED: This causes the crash in new Lucide versions
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// --- CONFIGURATION & UTILITIES ---
const getUserDocPath = (userId) => {
  const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
  return `artifacts/${appId}/users/${userId}/profile/data`;
};

// --- HELPER COMPONENTS ---

const ToggleSwitch = ({ initialChecked = false, onChange }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);
  useEffect(() => setIsChecked(initialChecked), [initialChecked]);
  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onChange) onChange(newValue);
  };
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none`}
      style={{ backgroundColor: isChecked ? "#FF4458" : "#E5E7EB" }}
    >
      <span
        className={`${
          isChecked ? "translate-x-6" : "translate-x-1"
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out shadow`}
      />
    </button>
  );
};

const ProfileSection = ({
  title,
  children,
  badge,
  badgeColor = "bg-rose-500",
}) => (
  <div className="bg-white mt-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
        {title}
      </h2>
      {badge && (
        <span
          className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full`}
        >
          {badge}
        </span>
      )}
    </div>
    <div>{children}</div>
  </div>
);

const ListItem = ({
  icon,
  title,
  value,
  hasChevron = true,
  valueColor = "text-gray-400",
  onClick,
}) => {
  const IconComponent = icon;
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50"
      disabled={!onClick}
    >
      <div className="flex items-center">
        {IconComponent && (
          <IconComponent className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base text-gray-900">{title}</p>
        </div>
        <div className="flex items-center ml-2">
          <p className={`text-sm ${valueColor} mr-2`}>
            {displayValue || "Add"}
          </p>
          {hasChevron && (
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          )}
        </div>
      </div>
    </button>
  );
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full lg:max-w-md rounded-t-2xl lg:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all transform translate-y-0 lg:translate-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-400 p-1 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="w-6" />
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const SelectModal = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  allowMultiple = false,
}) => {
  const [selected, setSelected] = useState(
    allowMultiple ? selectedValue || [] : selectedValue
  );
  useEffect(() => {
    setSelected(allowMultiple ? selectedValue || [] : selectedValue);
  }, [selectedValue, allowMultiple]);

  const handleSelect = (value) => {
    if (allowMultiple) {
      const newSelected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      setSelected(newSelected);
    } else {
      setSelected(value);
      onSelect(value);
      onClose();
    }
  };
  const handleDone = () => {
    if (allowMultiple) onSelect(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={allowMultiple ? null : onClose}
      title={title}
    >
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-rose-500 transition-colors flex items-center justify-between shadow-sm"
          >
            <span className="text-gray-900 text-base">{option.label}</span>
            {(allowMultiple
              ? selected?.includes(option.value)
              : selected === option.value) && (
              <Check className="w-5 h-5 text-rose-500" />
            )}
          </button>
        ))}
      </div>
      {allowMultiple && (
        <button
          onClick={handleDone}
          className="w-full mt-6 bg-rose-500 text-white rounded-full py-3 font-semibold hover:bg-rose-600 shadow-lg transition"
        >
          Done
        </button>
      )}
    </Modal>
  );
};

const TextInputModal = ({
  isOpen,
  onClose,
  title,
  value,
  onSave,
  placeholder,
  maxLength,
}) => {
  const [text, setText] = useState(value || "");
  useEffect(() => {
    setText(value || "");
  }, [value]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border border-gray-300 rounded-xl p-4 min-h-[150px] text-gray-900 focus:outline-none focus:border-rose-500 resize-none shadow-inner"
      />
      <div className="flex justify-end items-center mt-2">
        <span className="text-sm text-gray-400">
          {text.length}/{maxLength}
        </span>
      </div>
      <button
        onClick={() => {
          onSave(text);
          onClose();
        }}
        disabled={!text.trim()}
        className="w-full mt-4 bg-rose-500 text-white rounded-full py-3 font-semibold hover:bg-rose-600 transition disabled:bg-gray-300"
      >
        Save
      </button>
    </Modal>
  );
};

const InterestsModal = ({ isOpen, onClose, selectedInterests, onSave }) => {
  const [selected, setSelected] = useState(selectedInterests || []);
  useEffect(() => {
    setSelected(selectedInterests || []);
  }, [selectedInterests]);
  const interestCategories = {
    "Going Out": [
      "🍷 Wine Tasting",
      "🎭 Theater",
      "🎵 Live Music",
      "🎪 Festivals",
      "🍻 Bar Hopping",
      "🎤 Karaoke",
    ],
    "Staying In": [
      "📺 Netflix",
      "📚 Reading",
      "🎮 Gaming",
      "🍳 Cooking",
      "🎨 Art",
      "✍️ Writing",
    ],
    "Creative Arts": [
      "📸 Photography",
      "🎬 Film",
      "🎹 Music",
      "💃 Dancing",
      "🖼️ Museums",
      "🎪 DIY",
    ],
    "Sports & Fitness": [
      "⚽ Soccer",
      "🏀 Basketball",
      "🏋️ Gym",
      "🧘 Yoga",
      "🏃 Running",
      "🚴 Cycling",
    ],
    Outdoor: [
      "🏕️ Camping",
      "🥾 Hiking",
      "🏖️ Beach",
      "🌄 Travel",
      "🎣 Fishing",
      "⛷️ Skiing",
    ],
    "Food & Drink": [
      "☕ Coffee",
      "🍕 Pizza",
      "🍜 Foodie",
      "🍰 Baking",
      "🍣 Sushi",
      "🌮 Tacos",
    ],
  };
  const toggleInterest = (interest) => {
    if (selected.includes(interest))
      setSelected(selected.filter((i) => i !== interest));
    else if (selected.length < 5) setSelected([...selected, interest]);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Interests">
      <p className="text-sm text-gray-500 mb-4">
        Choose up to 5 interests (
        <span className="font-bold text-rose-500">{selected.length}/5</span>)
      </p>
      <div className="max-h-80 overflow-y-auto space-y-4">
        {Object.entries(interestCategories).map(([category, interests]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border transition-colors text-sm shadow-sm ${
                    selected.includes(interest)
                      ? "bg-rose-500 text-white border-rose-500 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-rose-500"
                  }`}
                  disabled={
                    !selected.includes(interest) && selected.length >= 5
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          onSave(selected);
          onClose();
        }}
        disabled={selected.length === 0}
        className="w-full mt-6 bg-rose-500 text-white rounded-full py-3 font-semibold hover:bg-rose-600 transition disabled:bg-gray-300 shadow-lg"
      >
        Save Interests
      </button>
    </Modal>
  );
};

const PromptsModal = ({ isOpen, onClose, prompts, onSave }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [answer, setAnswer] = useState("");
  const promptOptions = [
    "I'm looking for...",
    "My most controversial opinion is...",
    "Don't hate me if I...",
    "I'm overly competitive about...",
    "The way to win me over is...",
    "I'm weirdly attracted to...",
    "Biggest risk I've taken...",
    "I go crazy for...",
    "Let's debate this topic...",
    "I'll pick the restaurant if...",
  ];

  const handleSavePrompt = () => {
    if (selectedPrompt && answer.trim()) {
      onSave({ question: selectedPrompt, answer });
      setSelectedPrompt(null);
      setAnswer("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Prompt">
      {!selectedPrompt ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {promptOptions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setSelectedPrompt(prompt);
                setAnswer("");
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-rose-500 transition-colors shadow-sm"
            >
              <span className="text-gray-900 text-base">{prompt}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-900">
              {selectedPrompt}
            </p>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            maxLength={150}
            className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] text-gray-900 focus:outline-none focus:border-rose-500 resize-none shadow-inner"
          />
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => setSelectedPrompt(null)}
              className="text-gray-500 text-sm p-1 hover:text-rose-500 transition"
            >
              ← Change Prompt
            </button>
            <span className="text-sm text-gray-400">{answer.length}/150</span>
          </div>
          <button
            onClick={handleSavePrompt}
            disabled={!answer.trim()}
            className="w-full mt-4 bg-rose-500 text-white rounded-full py-3 font-semibold hover:bg-rose-600 transition disabled:bg-gray-300 shadow-lg"
          >
            Add to Profile
          </button>
        </div>
      )}
    </Modal>
  );
};

const PhotoOptionsModal = ({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Add Photo">
    <div className="space-y-3">
      <button
        onClick={() => {
          onSelectCamera();
          onClose();
        }}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-rose-500 transition-colors shadow-md"
      >
        <Camera className="w-6 h-6 text-gray-600" />
        <span className="text-lg font-semibold text-gray-900">Take Photo</span>
      </button>
      <button
        onClick={() => {
          onSelectGallery();
          onClose();
        }}
        className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-rose-500 transition-colors shadow-md"
      >
        <Upload className="w-6 h-6 text-gray-600" />
        <span className="text-lg font-semibold text-gray-900">
          Choose from Gallery
        </span>
      </button>
    </div>
  </Modal>
);

const PreviewProfile = ({ profileData }) => {
  const defaultPhoto =
    "https://placehold.co/300x400/fecaca/991b1b?text=Main+Photo";
  const firstPhoto =
    profileData.photos && profileData.photos.length > 0
      ? profileData.photos[0]
      : defaultPhoto;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
        <div className="relative h-[500px] bg-gray-200">
          <img
            src={firstPhoto}
            alt="Profile Preview"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.src = defaultPhoto)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-white">
                You, {profileData.age || "21"}
              </h1>
              <CheckCircle2 size={24} className="text-blue-500 fill-white" />
            </div>
            <p className="text-white text-sm mt-1">
              Lives in {profileData.city || "Your City"}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {profileData.aboutMe && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">About Me</h3>
              <p className="text-gray-600">{profileData.aboutMe}</p>
            </div>
          )}
          {profileData.prompts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                My Prompts
              </h3>
              {profileData.prompts.map((prompt, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {prompt.question}
                  </p>
                  <p className="text-gray-900 font-medium">{prompt.answer}</p>
                </div>
              ))}
            </div>
          )}
          {profileData.interests?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-sm font-medium border border-rose-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 shadow-inner">
              <div className="flex items-center space-x-2">
                <Heart size={16} className="text-rose-500" />
                <span className="text-sm text-gray-700">
                  {profileData.lookingFor || "New Friends"}
                </span>
              </div>
            </div>
            {profileData.height && (
              <div className="bg-gray-50 rounded-xl p-3 shadow-inner">
                <div className="flex items-center space-x-2">
                  <Ruler size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {profileData.height}
                  </span>
                </div>
              </div>
            )}
          </div>
          {profileData.jobTitle && (
            <div className="bg-gray-50 rounded-xl p-3 shadow-inner">
              <div className="flex items-center space-x-2">
                <Briefcase size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">
                  {profileData.jobTitle}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-6 text-center">
        <p className="text-gray-500 text-sm">
          This is how your profile looks to others
        </p>
      </div>
    </div>
  );
};

// --- Main Edit Profile Component ---
export default function EditProfile({
  onNavigate,
  userData,
  setUserData,
  db,
  userId,
  storage,
}) {
  const profile = userData?.profile || {};
  const MAX_PHOTOS = 6;
  const [activeTab, setActiveTab] = useState("edit");
  
  // --- State Initialization ---
  const [photos, setPhotos] = useState(
    Array.isArray(profile.photos) ? profile.photos : []
  );
  const [smartPhotos, setSmartPhotos] = useState(profile.smartPhotos ?? true);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || "");
  const [prompts, setPrompts] = useState(profile.prompts || []);
  const [interests, setInterests] = useState(profile.interests || []);
  const [lookingFor, setLookingFor] = useState(
    profile.lookingFor || "New Friends"
  );
  const [pronouns, setPronouns] = useState(profile.pronouns || "");
  const [height, setHeight] = useState(profile.height || "");
  const [relationshipType, setRelationshipType] = useState(
    profile.relationshipType || []
  );
  const [languages, setLanguages] = useState(profile.languages || []);
  const [zodiac, setZodiac] = useState(profile.zodiac || "");
  const [education, setEducation] = useState(profile.education || "");
  const [familyPlans, setFamilyPlans] = useState(profile.familyPlans || "");
  const [personalityType, setPersonalityType] = useState(
    profile.personalityType || ""
  );
  const [communicationStyle, setCommunicationStyle] = useState(
    profile.communicationStyle || ""
  );
  const [loveStyle, setLoveStyle] = useState(profile.loveStyle || "");
  const [pets, setPets] = useState(profile.pets || "");
  const [drinking, setDrinking] = useState(profile.drinking || "");
  const [smoking, setSmoking] = useState(profile.smoking || "");
  const [workout, setWorkout] = useState(profile.workout || "");
  const [diet, setDiet] = useState(profile.diet || "");
  const [socialMedia, setSocialMedia] = useState(profile.socialMedia || "");
  const [sleeping, setSleeping] = useState(profile.sleeping || "");
  const [school, setSchool] = useState(profile.school || "");
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || "");
  const [company, setCompany] = useState(profile.company || "");
  const [city, setCity] = useState(profile.city || "Delhi");
  const [anthem, setAnthem] = useState(profile.anthem || "");
  const [hideAge, setHideAge] = useState(profile.hideAge ?? false);
  const [hideDistance, setHideDistance] = useState(
    profile.hideDistance ?? false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [gender, setGender] = useState(profile.gender || "");

  // --- Options Data ---
  const lookingForOptions = [
    { value: "New Friends", label: "New Friends" },
    { value: "Long-term partner", label: "Long-term partner" },
    { value: "Long-term, open to short", label: "Long-term, open to short" },
    { value: "Short-term, open to long", label: "Short-term, open to long" },
    { value: "Short-term fun", label: "Short-term fun" },
    { value: "Still figuring it out", label: "Still figuring it out" },
  ];
  const pronounOptions = [
    { value: "She/Her", label: "She/Her" },
    { value: "He/Him", label: "He/Him" },
    { value: "They/Them", label: "They/Them" },
    { value: "Ze/Zir", label: "Ze/Zir" },
    { value: "Prefer not to say", label: "Prefer not to say" },
  ];
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const heightOptions = Array.from({ length: 60 }, (_, i) => {
    const inches = i + 48;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return {
      value: `${feet}'${remainingInches}"`,
      label: `${feet}'${remainingInches}"`,
    };
  });
  const relationshipTypeOptions = [
    { value: "Monogamy", label: "Monogamy" },
    { value: "Ethically non-monogamous", label: "Ethically non-monogamous" },
    { value: "Open to exploring", label: "Open to exploring" },
    {
      value: "Figuring out my dating goals",
      label: "Figuring out my dating goals",
    },
  ];
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Hindi", label: "Hindi" },
    { value: "Mandarin", label: "Mandarin" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
  ];
  const zodiacOptions = [
    { value: "Aries", label: "Aries ♈" },
    { value: "Taurus", label: "Taurus ♉" },
    { value: "Gemini", label: "Gemini ♊" },
    { value: "Cancer", label: "Cancer ♋" },
    { value: "Leo", label: "Leo ♌" },
    { value: "Virgo", label: "Virgo ♍" },
    { value: "Libra", label: "Libra ♎" },
    { value: "Scorpio", label: "Scorpio ♏" },
    { value: "Sagittarius", label: "Sagittarius ♐" },
    { value: "Capricorn", label: "Capricorn ♑" },
    { value: "Aquarius", label: "Aquarius ♒" },
    { value: "Pisces", label: "Pisces ♓" },
  ];
  const educationOptions = [
    { value: "High School", label: "High School" },
    { value: "Trade School", label: "Trade School" },
    { value: "In College", label: "In College" },
    { value: "Undergraduate Degree", label: "Undergraduate Degree" },
    { value: "In Grad School", label: "In Grad School" },
    { value: "Graduate Degree", label: "Graduate Degree" },
  ];
  const familyPlansOptions = [
    { value: "Want someday", label: "Want someday" },
    { value: "Don't want", label: "Don't want" },
    { value: "Have and want more", label: "Have and want more" },
    { value: "Have and don't want more", label: "Have and don't want more" },
    { value: "Not sure yet", label: "Not sure yet" },
  ];
  const personalityOptions = [
    { value: "INTJ", label: "INTJ" },
    { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" },
    { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" },
    { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" },
    { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" },
    { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" },
    { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" },
    { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" },
    { value: "ESFP", label: "ESFP" },
  ];
  const communicationOptions = [
    { value: "Big time texter", label: "Big time texter" },
    { value: "Phone caller", label: "Phone caller" },
    { value: "Video chatter", label: "Video chatter" },
    { value: "Bad texter", label: "Bad texter" },
    { value: "Better in person", label: "Better in person" },
  ];
  const loveStyleOptions = [
    { value: "Thoughtful gestures", label: "Thoughtful gestures" },
    { value: "Presents", label: "Presents" },
    { value: "Touch", label: "Touch" },
    { value: "Compliments", label: "Compliments" },
    { value: "Time together", label: "Time together" },
  ];
  const petsOptions = [
    { value: "Dog", label: "🐕 Dog" },
    { value: "Cat", label: "🐈 Cat" },
    { value: "Both", label: "🐕🐈 Dog & Cat" },
    { value: "Other", label: "🐠 Other Pets" },
    { value: "None", label: "Pet-free" },
    { value: "Want", label: "Want a pet" },
    { value: "Allergic", label: "Allergic to pets" },
  ];
  const drinkingOptions = [
    { value: "Not for me", label: "Not for me" },
    { value: "Sober", label: "Sober" },
    { value: "Sober curious", label: "Sober curious" },
    { value: "On special occasions", label: "On special occasions" },
    { value: "Socially on weekends", label: "Socially on weekends" },
    { value: "Most nights", label: "Most nights" },
  ];
  const smokingOptions = [
    { value: "Non-smoker", label: "Non-smoker" },
    { value: "Smoker", label: "Smoker" },
    { value: "Social smoker", label: "Social smoker" },
    { value: "Trying to quit", label: "Trying to quit" },
  ];
  const workoutOptions = [
    { value: "Every day", label: "Every day" },
    { value: "Often", label: "Often" },
    { value: "Sometimes", label: "Sometimes" },
    { value: "Never", label: "Never" },
  ];
  const dietOptions = [
    { value: "Vegan", label: "Vegan" },
    { value: "Vegetarian", label: "Vegetarian" },
    { value: "Pescatarian", label: "Pescatarian" },
    { value: "Kosher", label: "Kosher" },
    { value: "Halal", label: "Halal" },
    { value: "Carnivore", label: "Carnivore" },
    { value: "Omnivore", label: "Omnivore" },
    { value: "Other", label: "Other" },
  ];
  const socialMediaOptions = [
    { value: "Influencer status", label: "Influencer status" },
    { value: "Socially active", label: "Socially active" },
    { value: "Off the grid", label: "Off the grid" },
    { value: "Passive scroller", label: "Passive scroller" },
  ];
  const sleepingOptions = [
    { value: "Early bird", label: "Early bird" },
    { value: "Night owl", label: "Night owl" },
    { value: "In a spectrum", label: "In a spectrum" },
  ];

  const handleAddPrompt = (newPrompt) => {
    if (prompts.length < 3) setPrompts([...prompts, newPrompt]);
  };

  const uploadPhotoToFirebase = async (file) => {
    // if (!storage || !userId) throw new Error('Storage Error');
    const uniqueFileName = `${userId}-${Date.now()}-${file.name}`;
    const storagePath = `users/${userId}/photos/${uniqueFileName}`;
    const imageRef = ref(storage, storagePath);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) return alert(`Max ${MAX_PHOTOS} photos`);
    setIsLoading(true);
    try {
      const fileURL = await uploadPhotoToFirebase(file);
      setPhotos((prevPhotos) => [...prevPhotos, fileURL]);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "user";
    input.onchange = handlePhotoUpload;
    input.click();
  };

  const handleGalleryUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    input.onchange = handlePhotoUpload;
    input.click();
  };

  const handleRemovePhoto = async (photoUrl, index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (!photoUrl.startsWith("https://firebasestorage.googleapis.com/")) return;
    if (!storage || !userId) return;
    try {
      const imageRef = ref(storage, photoUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleSave = async () => {
    if (!db || !userId) return;
    if(!gender) return alert("Please Select Gender")
    setIsLoading(true);

    const profileData = {
      aboutMe,
      city,
      jobTitle,
      school,
      company,
      anthem,
      photos,
      smartPhotos,
      lookingFor,
      pronouns,
      gender,
      height,
      relationshipType,
      languages,
      zodiac,
      education,
      familyPlans,
      personalityType,
      communicationStyle,
      loveStyle,
      pets,
      drinking,
      smoking,
      workout,
      diet,
      socialMedia,
      sleeping,
      prompts,
      interests,
      hideAge,
      hideDistance,
      lastUpdated: new Date().toISOString(),
    };

    try {
      // 1. Save to the specialized profile path (keeps Profile.jsx working)
      const profileDocRef = doc(db, getUserDocPath(userId));
      await setDoc(profileDocRef, profileData, { merge: true });

      // 2. Sync critical data to the 'users' collection (so Discover.jsx works in real-time)
      const userDocRef = doc(db, "users", userId);
      await setDoc(
        userDocRef,
        {
          photos, // IMPORTANT: Ensure this array of strings is saved
          aboutMe,
          gender,
          jobTitle,
          company,
          school,
          city,
          age: profile.age || "21",
          prompts,
          interests,
          height,
          education,
          drinking,
          smoking,
          zodiac,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );

      setUserData((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...profileData },
      }));
      onNavigate("profile");
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isReadyToSave = !isLoading;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white min-h-screen">
        <header className="border-b border-gray-200 sticky top-0 bg-white z-20">
          <div className="flex justify-between items-center px-6 py-4">
            <button
              onClick={() => onNavigate && onNavigate("profile")}
              className="p-2 -ml-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            <button
              onClick={handleSave}
              className="text-base font-bold cursor-pointer text-rose-500 hover:text-rose-600 disabled:text-gray-400"
              disabled={!isReadyToSave || isLoading}
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                "Done"
              )}
            </button>
          </div>
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 py-3 text-center cursor-pointer font-semibold text-sm transition-colors relative ${
                activeTab === "edit" ? "text-rose-500" : "text-gray-500"
              }`}
            >
              Edit{" "}
              {activeTab === "edit" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-3 text-center cursor-pointer font-semibold text-sm transition-colors relative ${
                activeTab === "preview" ? "text-rose-500" : "text-gray-500"
              }`}
            >
              Preview{" "}
              {activeTab === "preview" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
              )}
            </button>
          </div>
        </header>

        {/* Modals */}
        <SelectModal
          isOpen={activeModal === "lookingFor"}
          onClose={() => setActiveModal(null)}
          title="Looking for"
          options={lookingForOptions}
          selectedValue={lookingFor}
          onSelect={setLookingFor}
        />
        <SelectModal
          isOpen={activeModal === "pronouns"}
          onClose={() => setActiveModal(null)}
          title="Pronouns"
          options={pronounOptions}
          selectedValue={pronouns}
          onSelect={setPronouns}
        />
        <SelectModal 
          isOpen={activeModal === 'gender'} 
          onClose={() => setActiveModal(null)} 
          title="Gender" 
          options={genderOptions} 
          selectedValue={gender} 
          onSelect={setGender} 
        />

        <SelectModal
          isOpen={activeModal === "height"}
          onClose={() => setActiveModal(null)}
          title="Height"
          options={heightOptions}
          selectedValue={height}
          onSelect={setHeight}
        />
        <SelectModal
          isOpen={activeModal === "relationshipType"}
          onClose={() => setActiveModal(null)}
          title="Open to"
          options={relationshipTypeOptions}
          selectedValue={relationshipType}
          onSelect={setRelationshipType}
          allowMultiple={true}
        />
        <SelectModal
          isOpen={activeModal === "languages"}
          onClose={() => setActiveModal(null)}
          title="Languages I Know"
          options={languageOptions}
          selectedValue={languages}
          onSelect={setLanguages}
          allowMultiple={true}
        />
        <SelectModal
          isOpen={activeModal === "zodiac"}
          onClose={() => setActiveModal(null)}
          title="Zodiac"
          options={zodiacOptions}
          selectedValue={zodiac}
          onSelect={setZodiac}
        />
        <SelectModal
          isOpen={activeModal === "education"}
          onClose={() => setActiveModal(null)}
          title="Education"
          options={educationOptions}
          selectedValue={education}
          onSelect={setEducation}
        />
        <SelectModal
          isOpen={activeModal === "familyPlans"}
          onClose={() => setActiveModal(null)}
          title="Family Plans"
          options={familyPlansOptions}
          selectedValue={familyPlans}
          onSelect={setFamilyPlans}
        />
        <SelectModal
          isOpen={activeModal === "personalityType"}
          onClose={() => setActiveModal(null)}
          title="Personality Type"
          options={personalityOptions}
          selectedValue={personalityType}
          onSelect={setPersonalityType}
        />
        <SelectModal
          isOpen={activeModal === "communicationStyle"}
          onClose={() => setActiveModal(null)}
          title="Communication Style"
          options={communicationOptions}
          selectedValue={communicationStyle}
          onSelect={setCommunicationStyle}
        />
        <SelectModal
          isOpen={activeModal === "loveStyle"}
          onClose={() => setActiveModal(null)}
          title="Love Style"
          options={loveStyleOptions}
          selectedValue={loveStyle}
          onSelect={setLoveStyle}
        />
        <SelectModal
          isOpen={activeModal === "pets"}
          onClose={() => setActiveModal(null)}
          title="Pets"
          options={petsOptions}
          selectedValue={pets}
          onSelect={setPets}
        />
        <SelectModal
          isOpen={activeModal === "drinking"}
          onClose={() => setActiveModal(null)}
          title="Drinking"
          options={drinkingOptions}
          selectedValue={drinking}
          onSelect={setDrinking}
        />
        <SelectModal
          isOpen={activeModal === "smoking"}
          onClose={() => setActiveModal(null)}
          title="Smoking"
          options={smokingOptions}
          selectedValue={smoking}
          onSelect={setSmoking}
        />
        <SelectModal
          isOpen={activeModal === "workout"}
          onClose={() => setActiveModal(null)}
          title="Workout"
          options={workoutOptions}
          selectedValue={workout}
          onSelect={setWorkout}
        />
        <SelectModal
          isOpen={activeModal === "diet"}
          onClose={() => setActiveModal(null)}
          title="Dietary Preference"
          options={dietOptions}
          selectedValue={diet}
          onSelect={setDiet}
        />
        <SelectModal
          isOpen={activeModal === "socialMedia"}
          onClose={() => setActiveModal(null)}
          title="Social Media"
          options={socialMediaOptions}
          selectedValue={socialMedia}
          onSelect={setSocialMedia}
        />
        <SelectModal
          isOpen={activeModal === "sleeping"}
          onClose={() => setActiveModal(null)}
          title="Sleeping Habits"
          options={sleepingOptions}
          selectedValue={sleeping}
          onSelect={setSleeping}
        />

        <TextInputModal
          isOpen={activeModal === "aboutMe"}
          onClose={() => setActiveModal(null)}
          title="About Me"
          value={aboutMe}
          onSave={setAboutMe}
          placeholder="Write a bit about yourself..."
          maxLength={500}
        />
        <TextInputModal
          isOpen={activeModal === "school"}
          onClose={() => setActiveModal(null)}
          title="School"
          value={school}
          onSave={setSchool}
          placeholder="Enter your school name"
          maxLength={100}
        />
        <TextInputModal
          isOpen={activeModal === "jobTitle"}
          onClose={() => setActiveModal(null)}
          title="Job Title"
          value={jobTitle}
          onSave={setJobTitle}
          placeholder="Enter your job title"
          maxLength={100}
        />
        <TextInputModal
          isOpen={activeModal === "company"}
          onClose={() => setActiveModal(null)}
          title="Company"
          value={company}
          onSave={setCompany}
          placeholder="Enter your company name"
          maxLength={100}
        />
        <TextInputModal
          isOpen={activeModal === "city"}
          onClose={() => setActiveModal(null)}
          title="Living In"
          value={city}
          onSave={setCity}
          placeholder="Enter your city"
          maxLength={100}
        />

        <InterestsModal
          isOpen={activeModal === "interests"}
          onClose={() => setActiveModal(null)}
          selectedInterests={interests}
          onSave={setInterests}
        />
        <PromptsModal
          isOpen={activeModal === "prompts"}
          onClose={() => setActiveModal(null)}
          prompts={prompts}
          onSave={handleAddPrompt}
        />
        <PhotoOptionsModal
          isOpen={activeModal === "photoOptions"}
          onClose={() => setActiveModal(null)}
          onSelectCamera={handleCameraCapture}
          onSelectGallery={handleGalleryUpload}
        />

        {activeTab === "edit" ? (
          <main className="pb-20 bg-gray-50 px-4 lg:px-8">
            <div className="pt-4 pb-4 bg-white rounded-xl shadow-lg mt-4">
              <h3 className="text-lg font-bold text-gray-800 px-4 mb-3">
                Profile Photos (Max {MAX_PHOTOS})
              </h3>
              <div className=" grid grid-cols-3 gap-3 px-4 sm:grid-cols-6">
                {photos.slice(0, MAX_PHOTOS).map((photo, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-900 rounded-lg overflow-hidden"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <img
                      src={photo}
                      alt={`Profile ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.target.src = `https://placehold.co/300x400/fecaca/991b1b?text=${
                          index + 1
                        }`)
                      }
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo, index)}
                      className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-1.5 hover:bg-gray-900 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                {[...Array(MAX_PHOTOS - photos.length)].map((_, i) => (
                  <button
                    key={`empty-${photos.length + i}`}
                    onClick={() => setActiveModal("photoOptions")}
                    className="rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center hover:bg-gray-200 transition-colors p-2"
                    style={{ aspectRatio: "3/4" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="animate-spin w-6 h-6 text-gray-500" />
                    ) : (
                      <Plus className="w-6 h-6 text-gray-500" />
                    )}
                    <span className="text-xs text-gray-500 mt-1">
                      Add Photo
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-start px-4 mt-6 pt-4 border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <h4 className="font-semibold text-gray-900 text-base">
                    Smart Photos
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Tinder tests your photos to show your best one first.
                  </p>
                </div>
                <ToggleSwitch
                  initialChecked={smartPhotos}
                  onChange={setSmartPhotos}
                />
              </div>
            </div>

            <ProfileSection title="About Me" badge="+80% MATCHES">
              <div className="px-4 py-4">
                <button
                  onClick={() => setActiveModal("aboutMe")}
                  className="w-full bg-gray-50 rounded-lg p-3 border border-gray-200 text-left hover:border-rose-500 transition-colors shadow-inner"
                >
                  {aboutMe ? (
                    <p className="text-sm text-gray-900 truncate">{aboutMe}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Tell us about yourself
                    </p>
                  )}
                </button>
              </div>
              <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-900 font-semibold">
                    Prompts ({prompts.length}/3)
                  </p>
                  <button
                    onClick={() =>
                      prompts.length < 3 ? setActiveModal("prompts") : null
                    }
                    className={`rounded-full px-3 py-1 text-xs font-bold flex items-center transition ${
                      prompts.length < 3
                        ? "bg-rose-500 text-white hover:bg-rose-600"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    ADD PROMPT
                  </button>
                </div>
                {prompts.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {prompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {prompt.question}
                        </p>
                        <p className="text-sm text-gray-900">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Answer a question to share more about yourself.
                  </p>
                )}
              </div>
            </ProfileSection>

            <ProfileSection title="Interests" badge="+8% MATCHES">
              <div className="px-4 py-4">
                {interests.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-sm font-medium border border-rose-200"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveModal("interests")}
                      className="w-full bg-white border border-rose-500 text-rose-500 rounded-full py-3 font-semibold hover:bg-rose-50 transition-colors shadow-sm"
                    >
                      Edit Interests
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      Let everyone know what you're into
                    </p>
                    <button
                      onClick={() => setActiveModal("interests")}
                      className="w-full bg-rose-500 text-white rounded-full py-3 font-semibold hover:bg-rose-600 transition-colors shadow-lg"
                    >
                      Select Interests
                    </button>
                  </>
                )}
              </div>
            </ProfileSection>

            <ProfileSection title="Relationship Goals">
              <ListItem
                icon={Heart}
                title="Looking for"
                value={lookingFor}
                valueColor="text-yellow-500"
                onClick={() => setActiveModal("lookingFor")}
              />
              <ListItem
                icon={Heart}
                title="Open to"
                value={relationshipType}
                valueColor={
                  relationshipType.length > 0
                    ? "text-gray-900"
                    : "text-gray-400 italic"
                }
                onClick={() => setActiveModal("relationshipType")}
              />
            </ProfileSection>

            <ProfileSection title="Basics">
              <ListItem
                icon={User}
                title="Pronouns"
                value={pronouns}
                onClick={() => setActiveModal("pronouns")}
              />
              <ListItem 
                icon={User} 
                title="Gender" 
                value={gender || "Select"} 
                onClick={() => setActiveModal('gender')} 
              />

              <ListItem
                icon={Ruler}
                title="Height"
                value={height}
                onClick={() => setActiveModal("height")}
              />
              <ListItem
                icon={BookOpen}
                title="Languages I Know"
                value={languages}
                valueColor={
                  languages.length > 0
                    ? "text-gray-900"
                    : "text-gray-400 italic"
                }
                onClick={() => setActiveModal("languages")}
              />
              <ListItem
                icon={Sprout}
                title="Zodiac"
                value={zodiac}
                onClick={() => setActiveModal("zodiac")}
              />
              <ListItem
                icon={GraduationCap}
                title="Education"
                value={education}
                onClick={() => setActiveModal("education")}
              />
              <ListItem
                icon={Users}
                title="Family Plans"
                value={familyPlans}
                onClick={() => setActiveModal("familyPlans")}
              />
            </ProfileSection>

            <ProfileSection title="Personality">
              {/* REPLACED UserSquare with User here */}
              <ListItem
                icon={User} 
                title="Personality Type"
                value={personalityType}
                onClick={() => setActiveModal("personalityType")}
              />
              <ListItem
                icon={MessageSquare}
                title="Communication Style"
                value={communicationStyle}
                onClick={() => setActiveModal("communicationStyle")}
              />
              <ListItem
                icon={Heart}
                title="Love Style"
                value={loveStyle}
                onClick={() => setActiveModal("loveStyle")}
              />
            </ProfileSection>

            <ProfileSection title="Lifestyle">
              <ListItem
                icon={Cat}
                title="Pets"
                value={pets}
                onClick={() => setActiveModal("pets")}
              />
              <ListItem
                icon={GlassWater}
                title="Drinking"
                value={drinking}
                onClick={() => setActiveModal("drinking")}
              />
              <ListItem
                icon={Cigarette}
                title="Smoking"
                value={smoking}
                onClick={() => setActiveModal("smoking")}
              />
              <ListItem
                icon={Dumbbell}
                title="Workout"
                value={workout}
                onClick={() => setActiveModal("workout")}
              />
              <ListItem
                icon={Utensils}
                title="Dietary Preference"
                value={diet}
                onClick={() => setActiveModal("diet")}
              />
              <ListItem
                icon={Moon}
                title="Sleeping Habits"
                value={sleeping}
                onClick={() => setActiveModal("sleeping")}
              />
              <ListItem
                icon={Music}
                title="Social Media"
                value={socialMedia}
                onClick={() => setActiveModal("socialMedia")}
              />
            </ProfileSection>

            <ProfileSection title="Work & Education">
              <ListItem
                icon={Briefcase}
                title="Job Title"
                value={jobTitle}
                onClick={() => setActiveModal("jobTitle")}
              />
              <ListItem
                icon={Building}
                title="Company"
                value={company}
                onClick={() => setActiveModal("company")}
              />
              <ListItem
                icon={School}
                title="School"
                value={school}
                onClick={() => setActiveModal("school")}
              />
              <ListItem
                icon={MapPin}
                title="Living In"
                value={city}
                onClick={() => setActiveModal("city")}
              />
            </ProfileSection>

            <ProfileSection title="Privacy & Visibility">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center flex-1">
                  <EyeOff className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-base text-gray-900">Don't Show My Age</p>
                </div>
                <ToggleSwitch initialChecked={hideAge} onChange={setHideAge} />
              </div>
              <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center flex-1">
                  <EyeOff className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-base text-gray-900">
                    Don't Show My Distance
                  </p>
                </div>
                <ToggleSwitch
                  initialChecked={hideDistance}
                  onChange={setHideDistance}
                />
              </div>
            </ProfileSection>
          </main>
        ) : (
          <PreviewProfile
            profileData={{
              photos,
              aboutMe,
              prompts,
              interests,
              lookingFor,
              height,
              jobTitle,
              city,
              age: profile.age,
            }}
          />
        )}
      </div>
    </div>
  );
}
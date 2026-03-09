import { useEffect, useRef, useState } from "react";
import {
  generateSyncCode,
  setUserProfile,
  type UserProfile,
} from "../../storage/db";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const profile: UserProfile = {
        name: name.trim(),
        syncId: generateSyncCode(),
        createdAt: Date.now(),
      };
      await setUserProfile(profile);
      onComplete(profile);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-bg">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
      </div>

      <div className="onboarding-content">
        <div className="onboarding-logo">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Flo Cycle Logo</title>
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="url(#logo-grad)"
              opacity="0.15"
            />
            <path
              d="M24 8C17 8 13 14 13 20C13 26 17 32 24 40C31 32 35 26 35 20C35 14 31 8 24 8Z"
              fill="url(#logo-grad)"
            />
            <defs>
              <linearGradient id="logo-grad" x1="13" y1="8" x2="35" y2="40">
                <stop stopColor="#FF6B9D" />
                <stop offset="1" stopColor="#C44AFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1>Welcome to Flo Cycle</h1>
        <p>What should we call you?</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Setting up..." : "Get Started"}
          </button>
        </form>

        <p className="onboarding-note">
          Your data is stored locally in this browser. You'll get a unique Sync
          ID to connect other devices.
        </p>
      </div>
    </div>
  );
}

"use client";

import { User, Venus, Mars, ChevronRight, Heart, Zap } from "lucide-react";
import { RadioGroup, Switch } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";

export default function FindPartner() {
  const [gender, setGender] = useState("both");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [ageRange, setAgeRange] = useState([18, 40]);
  const [isSearching, setIsSearching] = useState(false);

  // For age range slider
  const rangeRef = useRef(null);
  const range1Ref = useRef(null);
  const range2Ref = useRef(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  // For demo purposes - animation states
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (rangeRef.current) {
      setSliderWidth(rangeRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setAnimationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setAnimationProgress(0);
    }
  }, [isSearching]);

  const handleStartSearching = () => {
    setIsSearching(true);
    // In a real app, you would start the search process here
    setTimeout(() => {
      setIsSearching(false);
      setAnimationProgress(0);
    }, 5000);
  };

  // Custom range slider handlers
  const handleRangeChange = (e, index) => {
    const value = parseInt(e.target.value);
    const newRange = [...ageRange];

    // Ensure min value doesn't exceed max value and vice versa
    if (index === 0) {
      if (value < newRange[1]) {
        newRange[0] = value;
      }
    } else {
      if (value > newRange[0]) {
        newRange[1] = value;
      }
    }

    setAgeRange(newRange);
  };

  return (
    <section className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-4 px-6">
        <h1 className="text-white font-medium flex items-center gap-2 text-lg">
          <User className="w-5 h-5" />
          Find Your Perfect Match
        </h1>
      </div>

      <div className="p-6 space-y-8">
        {/* Gender Selection with improved UI */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <Heart className="w-4 h-4 text-pink-500 mr-2" />
            Partner Preferences
          </h3>
          <RadioGroup
            value={gender}
            onChange={setGender}
            className="grid grid-cols-3 gap-4"
          >
            <RadioGroup.Option value="female">
              {({ checked }) => (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center ${
                    checked
                      ? "bg-gradient-to-br from-pink-50 to-pink-100 ring-2 ring-pink-400 text-pink-700"
                      : "ring-1 ring-gray-200 hover:ring-pink-300 hover:bg-pink-50"
                  }`}
                >
                  <Venus
                    className={`w-6 h-6 ${
                      checked ? "text-pink-500" : "text-pink-400"
                    } mb-2`}
                  />
                  <span className="block font-medium">Female</span>
                </div>
              )}
            </RadioGroup.Option>

            <RadioGroup.Option value="male">
              {({ checked }) => (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center ${
                    checked
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-400 text-blue-700"
                      : "ring-1 ring-gray-200 hover:ring-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <Mars
                    className={`w-6 h-6 ${
                      checked ? "text-blue-500" : "text-blue-400"
                    } mb-2`}
                  />
                  <span className="block font-medium">Male</span>
                </div>
              )}
            </RadioGroup.Option>

            <RadioGroup.Option value="both">
              {({ checked }) => (
                <div
                  className={`p-4 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center ${
                    checked
                      ? "bg-gradient-to-br from-purple-50 to-purple-100 ring-2 ring-purple-400 text-purple-700"
                      : "ring-1 ring-gray-200 hover:ring-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <Venus
                      className={`w-5 h-5 ${
                        checked ? "text-pink-500" : "text-pink-400"
                      }`}
                    />
                    <Mars
                      className={`w-5 h-5 ${
                        checked ? "text-blue-500" : "text-blue-400"
                      }`}
                    />
                  </div>
                  <span className="block font-medium">Both</span>
                </div>
              )}
            </RadioGroup.Option>
          </RadioGroup>
        </div>

        {/* Age Range Selection - Custom implementation */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <Zap className="w-4 h-4 text-amber-500 mr-2" />
            Age Preference
          </h3>
          <div className="px-2 py-6">
            <div className="flex justify-between mb-2 text-sm text-gray-500">
              <span>{ageRange[0]} years</span>
              <span>{ageRange[1]} years</span>
            </div>

            {/* Custom dual range slider */}
            <div className="relative w-full h-12" ref={rangeRef}>
              {/* Track background */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>

              {/* Selected range highlight */}
              <div
                className="absolute top-5 h-1 bg-blue-500 rounded-full"
                style={{
                  left: `${((ageRange[0] - 18) / (80 - 18)) * 100}%`,
                  right: `${100 - ((ageRange[1] - 18) / (80 - 18)) * 100}%`,
                }}
              ></div>

              {/* Min range slider */}
              <input
                ref={range1Ref}
                type="range"
                min="18"
                max="80"
                value={ageRange[0]}
                onChange={(e) => handleRangeChange(e, 0)}
                className="absolute top-0 left-0 w-full h-10 opacity-0 cursor-pointer z-10"
              />

              {/* Max range slider */}
              <input
                ref={range2Ref}
                type="range"
                min="18"
                max="80"
                value={ageRange[1]}
                onChange={(e) => handleRangeChange(e, 1)}
                className="absolute top-0 left-0 w-full h-10 opacity-0 cursor-pointer z-20"
              />

              {/* Thumb indicators */}
              <div
                className="absolute top-3 w-5 h-5 bg-white rounded-full shadow-md border-2 border-blue-500 z-30"
                style={{
                  left: `calc(${
                    ((ageRange[0] - 18) / (80 - 18)) * 100
                  }% - 10px)`,
                }}
              ></div>

              <div
                className="absolute top-3 w-5 h-5 bg-white rounded-full shadow-md border-2 border-blue-500 z-30"
                style={{
                  left: `calc(${
                    ((ageRange[1] - 18) / (80 - 18)) * 100
                  }% - 10px)`,
                }}
              ></div>
            </div>

            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>18</span>
              <span>80</span>
            </div>
          </div>
        </div>

        {/* Anonymous Mode - Improved */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center">
                Anonymous Mode
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  Optional
                </span>
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Hide your identity during chat for privacy
              </p>
            </div>
            <Switch
              checked={isAnonymous}
              onChange={setIsAnonymous}
              className={`${isAnonymous ? "bg-blue-500" : "bg-gray-300"}
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
            >
              <span className="sr-only">Anonymous mode</span>
              <span
                aria-hidden="true"
                className={`${isAnonymous ? "translate-x-5" : "translate-x-0"}
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          </div>
        </div>

        {/* Start Button - Improved with animation */}
        <button
          onClick={handleStartSearching}
          disabled={isSearching}
          className={`w-full relative py-4 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition duration-300 ease-in-out text-white overflow-hidden ${
            isSearching
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSearching && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-600 z-0"
              style={{ width: `${animationProgress}%` }}
            ></div>
          )}
          <span className="z-10 flex items-center">
            {isSearching ? "Searching..." : "Find Partner"}
            {!isSearching && <ChevronRight className="w-5 h-5 ml-1" />}
          </span>
        </button>
      </div>
    </section>
  );
}

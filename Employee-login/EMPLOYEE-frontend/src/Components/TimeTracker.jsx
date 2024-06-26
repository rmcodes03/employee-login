import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';

const Stopwatch = () => {
  const [task, setTask] = useState(""); // State for the task description
  const [projectName, setProjectName] = useState("");
  const [tags, setTags] = useState([]); // State for storing selected tags
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [projects, setProjects] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false); // State to control the visibility of the dropdown
  const intervalRef = useRef(); // Ref to store the interval reference

  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/auth/project_list');
      setProjects(response.data); // Update with the response data directly
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get('http://localhost:5000/auth/tag_list');
      setTags(response.data.tags.map(tag => ({ name: tag.tag, checked: false }))); // Initialize tags with unchecked state
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const startTimer = () => {
    const startTime = Date.now() - (pausedTime ? pausedTime : 0);
    intervalRef.current = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);
  };

  const handleStart = () => {
    if (!projectName.trim()) {
      alert("Project name is required!");
      return;
    }
    setIsRunning(true);
    startTimer(); // Start the timer
  };

  const handlePause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current); // Clear the interval
    setPausedTime(timeElapsed);
  };

  const handleResume = () => {
    setIsRunning(true);
    startTimer(); // Resume the timer
  };

  const handleReset = () => {
    clearInterval(intervalRef.current); // Clear the interval
    setTimeElapsed(0);
    setPausedTime(0);
    setIsRunning(false);
    setTask("");
    setProjectName("");
    // Reset tags to their initial state (unchecked)
    setTags(tags.map(tag => ({ ...tag, checked: false })));
  };

  const handleTagClick = () => {
    setShowDropdown(!showDropdown); // Toggle the visibility of the dropdown
  };

  const handleTagSelect = (tagName) => {
    // Toggle the checked state of the clicked tag
    const updatedTags = tags.map(tag =>
      tag.name === tagName ? { ...tag, checked: !tag.checked } : tag
    );
    setTags(updatedTags);
  };

  const handleSubmit = () => {
    if (!task.trim()) {
      alert("Task description is required!");
      return;
    }
    if (!projectName.trim()) {
      alert("Project name is required!");
      return;
    }
    const selectedTags = tags.filter(tag => tag.checked).map(tag => tag.name);

    // Send data to backend to store in database
    axios.post('http://localhost:5000/auth/add_project_data', {
      task,
      projectName,
      tags: selectedTags,
      timeElapsed
    })
    .then(response => {
      console.log(response.data);
      // Retrieve new project data from server response
      setProjects([...projects, newProject]);
      resetTimer();
      handleReset();
      // Display pop-up message
      //alert("Project data added successfully!");
    })
    .catch(error => {
      console.error('Error adding project:', error);
      //alert('Failed to add project');
    });
    handleReset();
  };

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="tw-flex tw-flex-col tw-items-center tw-p-4">
        <div className="tw-mb-4 tw-border-2 tw-border-black tw-rounded tw-p-2 tw-flex tw-w-full">
          <input
            type="text"
            placeholder="What are you working on?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="tw-border tw-border-gray-500 tw-px-2 tw-py-1 tw-mr-2 tw-flex-1"
            style={{ borderBottomRightRadius: 0, borderTopRightRadius: 0 }} // Adjust border radius for left input
          />
          <div className="tw-relative tw-flex-1">
            {/* Project dropdown */}
            <select
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="tw-border tw-border-gray-500 tw-px-2 tw-py-1 tw-mr-2 tw-flex-1"
            >
              <option value="">Select Project</option>
              {projects.map((project, index) => (
                <option key={index} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>
          <div className="absolute tw-right ">
            {/* Tag symbol */}
            <div
              className="tw-border tw-border-gray-500 tw-px-2 tw-py-1 tw-cursor-pointer"
              onClick={handleTagClick} // Handle click to show dropdown
              style={{ marginRight: '8px' }} // Reduce space between tag and project
            >
              {tags.filter(tag => tag.checked).length > 0 ? tags.filter(tag => tag.checked).map(tag => tag.name).join(", ") : <i className="bi bi-tag"></i>}
            </div>
            {/* Dropdown */}
            {showDropdown && (
              <div className="tw-absolute tw-mt-1 tw-bg-white tw-shadow-md tw-rounded-md">
                <ul>
                  {tags.map((tag, index) => (
                    <li key={index} className="tw-cursor-pointer tw-px-3 tw-py-2 tw-hover:bg-gray-200">
                      <input
                        type="checkbox"
                        checked={tag.checked}
                        onChange={() => handleTagSelect(tag.name)}
                      />
                      {tag.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={!projectName.trim()} // Disable button if projectName is empty or contains only whitespace
              className={`tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-1 tw-px-4 tw-rounded ${!projectName.trim() && "tw-opacity-50 tw-cursor-not-allowed"}`}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} // Adjust border radius for start button
            >
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="tw-bg-red-500 tw-hover:bg-red-700 tw-text-white tw-font-bold tw-py-1 tw-px-4 tw-rounded tw-mr-2"
              >
                Pause
              </button>
              <button
                onClick={handleReset}
                className="tw-bg-gray-500 tw-hover:bg-gray-700 tw-text-white tw-font-bold tw-py-1 tw-px-4 tw-rounded"
              >
                Reset
              </button>
            </>
          )}
        </div>
        <div>
          <h2 className="tw-font-bold">Time Taken: {formatTime(timeElapsed)}</h2>
        </div>
        {isRunning && (
          <button
            onClick={handleSubmit}
            className="tw-bg-green-500 tw-hover:bg-green-700 tw-text-white tw-font-bold tw-py-1 tw-px-4 tw-rounded"
          >
            Submit
          </button>
        )}
        {!isRunning && pausedTime > 0 && (
          <button
            onClick={handleResume}
            className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-1 tw-px-4 tw-rounded"
          >
            Resume
          </button>
        )}
      </div>
    </>
  );
};

export default Stopwatch;

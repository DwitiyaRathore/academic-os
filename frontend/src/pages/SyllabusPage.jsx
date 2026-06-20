import { useState, useEffect } from "react";
import axios from "axios";

function SyllabusPage() {
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicNames, setNewTopicNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get("http://localhost:8000/subjects", authHeaders);
      setSubjects(res.data);

      // fetch topics for each subject
      const topicsData = {};
      for (const subject of res.data) {
        const topicsRes = await axios.get(
          `http://localhost:8000/subjects/${subject.id}/topics`,
          authHeaders
        );
        topicsData[subject.id] = topicsRes.data;
      }
      setTopicsBySubject(topicsData);
    } catch (err) {
      setError("Could not load your syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    try {
      await axios.post(
        "http://localhost:8000/subjects",
        { name: newSubjectName },
        authHeaders
      );
      setNewSubjectName("");
      fetchSubjects();
    } catch (err) {
      setError("Could not add subject.");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await axios.delete(`http://localhost:8000/subjects/${subjectId}`, authHeaders);
      fetchSubjects();
    } catch (err) {
      setError("Could not delete subject.");
    }
  };

  const handleAddTopic = async (subjectId) => {
    const topicName = newTopicNames[subjectId];
    if (!topicName || !topicName.trim()) return;

    try {
      await axios.post(
        "http://localhost:8000/topics",
        { name: topicName, subject_id: subjectId },
        authHeaders
      );
      setNewTopicNames({ ...newTopicNames, [subjectId]: "" });
      fetchSubjects();
    } catch (err) {
      setError("Could not add topic.");
    }
  };

  const handleToggleTopic = async (topicId) => {
    try {
      await axios.patch(
        `http://localhost:8000/topics/${topicId}/complete`,
        {},
        authHeaders
      );
      fetchSubjects();
    } catch (err) {
      setError("Could not update topic.");
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      await axios.delete(`http://localhost:8000/topics/${topicId}`, authHeaders);
      fetchSubjects();
    } catch (err) {
      setError("Could not delete topic.");
    }
  };

  const getProgress = (subjectId) => {
    const topics = topicsBySubject[subjectId] || [];
    if (topics.length === 0) return 0;
    const completed = topics.filter((t) => t.is_complete).length;
    return Math.round((completed / topics.length) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Loading your syllabus...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        📚 Syllabus Tracker
      </h1>
      <p className="text-gray-600 mb-6">
        Track your subjects and topics as you complete them.
      </p>

      {error && <p className="text-red-600 mb-4 font-medium">{error}</p>}

      {/* Add new subject */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6 flex gap-3">
        <input
          type="text"
          placeholder="New subject name"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAddSubject}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
        >
          + Add Subject
        </button>
      </div>

      {/* Subject list */}
      {subjects.length === 0 ? (
        <p className="text-gray-500">No subjects yet. Add one above to get started.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {subjects.map((subject) => {
            const topics = topicsBySubject[subject.id] || [];
            const progress = getProgress(subject.id);

            return (
              <div
                key={subject.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-5"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {subject.name}
                  </h2>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{progress}% complete</p>

                {/* Topics */}
                <div className="flex flex-col gap-2 mb-4">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={topic.is_complete}
                          onChange={() => handleToggleTopic(topic.id)}
                          className="w-4 h-4"
                        />
                        <span
                          className={
                            topic.is_complete
                              ? "line-through text-gray-400"
                              : "text-gray-700"
                          }
                        >
                          {topic.name}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-red-400 hover:text-red-600 text-sm ml-3"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add topic */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New topic name"
                    value={newTopicNames[subject.id] || ""}
                    onChange={(e) =>
                      setNewTopicNames({
                        ...newTopicNames,
                        [subject.id]: e.target.value,
                      })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => handleAddTopic(subject.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg text-sm transition"
                  >
                    + Topic
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SyllabusPage;
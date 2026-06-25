import type { KnowledgeTopic } from "./types";

import React, { useState, useEffect } from "react";
import { getTopics, saveTopic, deleteTopic } from "./services/api";
import type { Topic, Cadence } from "./types";

const TopicForm: React.FC<{
  onSave: () => void;
  editingTopic: Topic | null;
  setEditingTopic: (topic: Topic | null) => void;
}> = ({ onSave, editingTopic, setEditingTopic }) => {
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingTopic) {
      setName(editingTopic.name);
      setCadence(editingTopic.cadence);
    } else {
      setName("");
      setCadence("weekly");
    }
  }, [editingTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSaving(true);
    const topicToSave = {
      id: editingTopic?.id,
      name,
      cadence,
    };
    await saveTopic(topicToSave);
    setIsSaving(false);
    setEditingTopic(null);
    onSave();
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">
        {editingTopic ? "Edit Topic" : "Create New Topic"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic-name" className="block text-sm font-medium text-slate-300 mb-1">
            Topic Name
          </label>
          <input
            id="topic-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 'frontend-updates'"
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Sync Cadence</label>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as Cadence)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
          </select>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          {editingTopic && (
            <button
              type="button"
              onClick={() => setEditingTopic(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-600"
          >
            {isSaving ? "Saving..." : editingTopic ? "Save Changes" : "Create Topic"}
          </button>
        </div>
      </form>
    </div>
  );
};

const TopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    const data = await getTopics();
    setTopics(data as unknown as Topic[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleDelete = async (topicId: string) => {
    if (window.confirm("Are you sure you want to delete this topic?")) {
      await deleteTopic(topicId);
      fetchTopics();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Topic Configuration</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Existing Topics</h2>
          <div className="bg-slate-800 shadow-lg rounded-lg">
            {loading ? (
              <div className="p-6 text-center text-slate-400">Loading topics...</div>
            ) : (
              <ul className="divide-y divide-slate-700">
                {topics.map((topic) => (
                  <li key={topic.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{topic.name}</p>
                      <p className="text-sm text-slate-400 capitalize">{topic.cadence} Sync</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => setEditingTopic(topic)}
                        className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(topic.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <TopicForm
            onSave={fetchTopics}
            editingTopic={editingTopic}
            setEditingTopic={setEditingTopic}
          />
        </div>
      </div>
    </div>
  );
};

export default TopicsPage;

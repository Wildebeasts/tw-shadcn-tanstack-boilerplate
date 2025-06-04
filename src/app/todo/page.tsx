"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Trash2,
  Edit3,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Tag,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { useClerk, useSession } from "@clerk/clerk-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import type { TodoItem } from "@/types/supabase";
import {
  getTodoItemsByUserId,
  createTodoItem,
  updateTodoItem,
  deleteTodoItem,
} from "@/services/todoItemService";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TodoPage = () => {
  const { user } = useClerk();
  const { session } = useSession();

  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date()); // Keep for header display
  const [newTaskPriority, setNewTaskPriority] = useState<number>(0); // 0: Low, 1: Medium, 2: High
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const activeSupabaseClient: SupabaseClient | null = useMemo(() => {
    if (session) {
      return createClerkSupabaseClient(() => session.getToken());
    }
    return null;
  }, [session]);

  useEffect(() => {
    if (user?.id && activeSupabaseClient) {
      setIsLoading(true);
      getTodoItemsByUserId(activeSupabaseClient, user.id)
        .then((data) => {
          setTasks(data || []);
        })
        .catch((error) => {
          console.error("Error fetching todo items:", error);
          setTasks([]); // Set to empty array on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user?.id, activeSupabaseClient]);

  const primaryButtonBg = "bg-[#DAE6D4]";
  const primaryButtonHoverBg = "hover:bg-[#c9d9c3]"; // A slightly darker shade
  const primaryButtonFocusRing = "focus:ring-[#DAE6D4]";
  const primaryButtonText = "text-black";

  const getPriorityStyles = (priority?: number | null) => {
    switch (priority) {
      case 2: // High
        return {
          label: "High",
          dotColor: "bg-red-500 dark:bg-red-400",
          textColor: "text-red-700 dark:text-red-300",
          selectBg: "bg-red-100 dark:bg-red-900/50",
          selectText: "text-red-700 dark:text-red-300",
          optionClass: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
        };
      case 1: // Medium
        return {
          label: "Medium",
          dotColor: "bg-yellow-500 dark:bg-yellow-400",
          textColor: "text-yellow-700 dark:text-yellow-300",
          selectBg: "bg-yellow-100 dark:bg-yellow-900/50",
          selectText: "text-yellow-700 dark:text-yellow-300",
          optionClass: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
        };
      default: // 0 or undefined/null for Low
        return {
          label: "Low",
          dotColor: `bg-[#A9C4A0] dark:bg-[#8aab81]`, // Darker shade of #DAE6D4 for dot
          textColor: `${primaryButtonText} dark:text-gray-300`,
          selectBg: `${primaryButtonBg} dark:bg-slate-700`,
          selectText: `${primaryButtonText} dark:text-gray-200`,
          optionClass: `${primaryButtonBg} dark:bg-slate-600 ${primaryButtonText} dark:text-gray-200`,
        };
    }
  };

  const handleAddTask = async () => {
    if (newTaskText.trim() === "" || !user?.id || !activeSupabaseClient) return;
    try {
      const newItem = await createTodoItem(activeSupabaseClient, {
        user_id: user.id,
        task_description: newTaskText,
        is_completed: false,
        priority: newTaskPriority, // Add priority
      });
      if (newItem) {
        setTasks((prevTasks) => [...prevTasks, newItem]);
      }
      setNewTaskText("");
      setNewTaskPriority(0); // Reset priority to Low
    } catch (error) {
      console.error("Error creating todo item:", error);
      // Optionally, show a toast notification to the user
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, priority: number) => {
    if (!user?.id || !activeSupabaseClient) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const updatedTask = await updateTodoItem(activeSupabaseClient, taskId, { priority });
      if (updatedTask) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error("Error updating task priority:", error);
    }
  };

  const startEdit = (task: TodoItem) => {
    setEditingTaskId(task.id!);
    setEditText(task.task_description);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditText("");
  };

  const saveEdit = async (taskId: string) => {
    if (!user?.id || !activeSupabaseClient || editText.trim() === "") return;
    try {
      const updatedTask = await updateTodoItem(activeSupabaseClient, taskId, {
        task_description: editText,
      });
      if (updatedTask) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
        );
      }
      cancelEdit();
    } catch (error) {
      console.error("Error updating task description:", error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!user?.id || !activeSupabaseClient) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const updatedTask = await updateTodoItem(activeSupabaseClient, taskId, {
        is_completed: !task.is_completed,
        completed_at: !task.is_completed ? new Date().toISOString() : undefined,
      });
      if (updatedTask) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error("Error updating todo item:", error);
    }
  };

  const removeTask = async (taskId: string) => {
    if (!user?.id || !activeSupabaseClient) return;
    try {
      await deleteTodoItem(activeSupabaseClient, taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting todo item:", error);
    }
  };

  // Calendar related state (basic for now)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonthName = selectedDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const getDaysArrayForMonth = () => {
    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) { daysArray.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { daysArray.push(i); }
    return daysArray;
  };
  const calendarDays = getDaysArrayForMonth();

  if (!user && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black">
        Please log in to view your ToDo list.
      </div>
    );
  }

  if (!activeSupabaseClient && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black">
        Initializing...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col text-gray-800 bg-gradient-to-b from-[#E4EFE7] to-white dark:text-gray-200 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Main Content (No Sidebar) */}
      <main className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-7xl mx-auto p-6 md:p-10 overflow-y-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${primaryButtonText} dark:text-gray-100`}>ToDo List</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="relative">
              <Input type="search" placeholder="Search tasks..." className="pl-10 w-64 bg-white/70 dark:bg-slate-700/70 border-gray-300 dark:border-slate-600" />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            </div>
            <Button className={`${primaryButtonBg} ${primaryButtonHoverBg} ${primaryButtonText} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryButtonFocusRing} transition-colors`}>
              <Bell size={18} className="mr-2" />
              Notifications
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add New Task Input */}
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl shadow-lg flex items-center space-x-3">
              <PlusCircle size={24} className={`${primaryButtonText} opacity-70 dark:opacity-100`} />
              <Input
                type="text"
                placeholder="Add a new task..."
                className="flex-grow border-0 focus:ring-0 bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                disabled={isLoading || !activeSupabaseClient}
              />
              <div className="relative">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                  className={`p-2 border-gray-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 ${primaryButtonFocusRing} focus:border-transparent appearance-none ${getPriorityStyles(newTaskPriority).selectBg} ${getPriorityStyles(newTaskPriority).selectText}`}
                  disabled={isLoading || !activeSupabaseClient}
                >
                  <option value={0} className={getPriorityStyles(0).optionClass}>Low</option>
                  <option value={1} className={getPriorityStyles(1).optionClass}>Medium</option>
                  <option value={2} className={getPriorityStyles(2).optionClass}>High</option>
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              <Button onClick={handleAddTask} className={`${primaryButtonBg} ${primaryButtonHoverBg} ${primaryButtonText} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryButtonFocusRing} transition-colors text-sm px-4 py-2`} disabled={isLoading || !activeSupabaseClient}>
                Add Task
              </Button>
            </div>

            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading tasks...</p>}
            {!isLoading && tasks.filter(task => !task.is_completed).length === 0 && (
                 <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pending tasks. Add some!</p>
            )}

            {/* Pending Tasks */}
            {!isLoading && tasks.filter(task => !task.is_completed).length > 0 && (
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${primaryButtonText} dark:text-gray-200`}>Today's Tasks</h3>
                <ul className="space-y-3">
                  {tasks.filter(task => !task.is_completed).map((task) => {
                    const priorityStyle = getPriorityStyles(task.priority);
                    const isEditing = editingTaskId === task.id;
                    return (
                    <li
                      key={task.id}
                      className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-xl shadow-md flex items-start space-x-4 transition-all hover:shadow-lg"
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id!)}
                        className={`mt-1 border-[#A9C4A0] dark:border-[#8aab81] data-[state=checked]:${primaryButtonBg} data-[state=checked]:${primaryButtonText} dark:data-[state=checked]:bg-[#A9C4A0] dark:data-[state=checked]:text-black`}
                        disabled={!activeSupabaseClient || isEditing}
                      />
                      <div className="flex-grow">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-[#A9C4A0] dark:focus:ring-[#8aab81]"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === "Enter") saveEdit(task.id!);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => saveEdit(task.id!)}
                                size="sm"
                                className={`${primaryButtonBg} ${primaryButtonHoverBg} ${primaryButtonText} focus:ring-2 ${primaryButtonFocusRing}`}
                              >
                                <Check size={16} className="mr-1" /> Save
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-200 dark:hover:bg-slate-700"
                              >
                                <X size={16} className="mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <label
                                    htmlFor={`task-${task.id}`}
                                    className={`font-medium ${
                                        task.is_completed ? "line-through text-gray-500 dark:text-gray-400" : `${primaryButtonText} dark:text-gray-100`
                                    } cursor-pointer`}
                                    >
                                    {task.task_description}
                                    </label>
                                    {task.entry_id && task.journal_entries && (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        From Journal:{" "}
                                        <span className="font-semibold">{task.journal_entries.title}</span>
                                      </p>
                                    )}
                                </div>
                                {task.due_date && (
                                    <span className={`text-xs bg-[#E6F0E2] ${primaryButtonText} dark:bg-slate-700/80 dark:text-gray-300 px-2 py-1 rounded-full`}>
                                        {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                                <span className={`w-3 h-3 rounded-full ${priorityStyle.dotColor}`}></span>
                                <span className={`${priorityStyle.textColor} font-medium`}>{priorityStyle.label} Priority</span>
                            </div>
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex flex-col items-end space-y-1">
                          <div className="relative">
                              <select
                                  value={task.priority ?? 0}
                                  onChange={(e) => handleUpdateTaskPriority(task.id!, Number(e.target.value))}
                                  className={`p-1 border-gray-300 dark:border-slate-600 rounded-md text-xs focus:ring-2 ${primaryButtonFocusRing} focus:border-transparent appearance-none w-24 text-center ${getPriorityStyles(task.priority ?? 0).selectBg} ${getPriorityStyles(task.priority ?? 0).selectText}`}
                                  disabled={!activeSupabaseClient}
                              >
                                  <option value={0} className={getPriorityStyles(0).optionClass}>Low</option>
                                  <option value={1} className={getPriorityStyles(1).optionClass}>Medium</option>
                                  <option value={2} className={getPriorityStyles(2).optionClass}>High</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                          </div>
                          <div className="flex items-center space-x-0.5 opacity-70 hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400" onClick={() => startEdit(task)} disabled={!activeSupabaseClient}>
                                  <Edit3 size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-500 hover:text-red-500 dark:hover:text-red-400" onClick={() => removeTask(task.id!)} disabled={!activeSupabaseClient}>
                                  <Trash2 size={14} />
                              </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  )})}
                </ul>
              </div>
            )}

            {/* Completed Tasks */}
            {!isLoading && tasks.filter(task => task.is_completed).length > 0 && (
                <div>
                    <h3 className={`text-xl font-semibold mb-4 mt-8 ${primaryButtonText} dark:text-gray-200`}>Completed</h3>
                    <ul className="space-y-3">
                    {tasks.filter(task => task.is_completed).map((task) => {
                        const priorityStyle = getPriorityStyles(task.priority);
                        return (
                        <li
                        key={task.id}
                        className="bg-white/60 dark:bg-slate-700/60 p-4 rounded-xl shadow-sm flex items-start space-x-4 opacity-70"
                        >
                        <Checkbox
                            id={`task-${task.id}`}
                            checked={task.is_completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id!)}
                            className={`mt-1 border-[#A9C4A0] dark:border-[#8aab81] data-[state=checked]:${primaryButtonBg} data-[state=checked]:${primaryButtonText} dark:data-[state=checked]:bg-[#A9C4A0] dark:data-[state=checked]:text-black`}
                            disabled={!activeSupabaseClient}
                        />
                        <div className="flex-grow">
                            <label
                            htmlFor={`task-${task.id}`}
                            className="font-medium line-through text-gray-500 dark:text-gray-400 cursor-pointer"
                            >
                            {task.task_description}
                            </label>
                            {task.entry_id && task.journal_entries && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                From Journal:{" "}
                                <span className="font-semibold">{task.journal_entries.title}</span>
                                </p>
                            )}
                            <div className="flex items-center space-x-2 text-xs mt-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${priorityStyle.dotColor}`}></span>
                                <span className={`${priorityStyle.textColor} opacity-80`}>{priorityStyle.label}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-500 hover:text-red-500 dark:hover:text-red-400" onClick={() => removeTask(task.id!)} disabled={!activeSupabaseClient}>
                            <Trash2 size={16} />
                        </Button>
                        </li>
                    )})}
                    </ul>
                </div>
            )}
          </div>

          {/* Calendar Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 dark:bg-slate-800/70 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className={`text-xl font-semibold ${primaryButtonText} dark:text-gray-200`}>{currentMonthName} {selectedDate.getFullYear()}</h4>
                <div className="flex space-x-1">
                  <Button variant="outline" size="icon" className={`w-8 h-8 border-gray-300 dark:border-slate-600 hover:bg-[#E6F0E2] dark:hover:bg-slate-700 focus:ring-2 ${primaryButtonFocusRing}`} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
                    <ChevronLeft size={18} />
                  </Button>
                  <Button variant="outline" size="icon" className={`w-8 h-8 border-gray-300 dark:border-slate-600 hover:bg-[#E6F0E2] dark:hover:bg-slate-700 focus:ring-2 ${primaryButtonFocusRing}`} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    className={`p-2 rounded-full w-9 h-9 flex items-center justify-center text-sm transition-colors
                      ${!day ? "bg-transparent" : `hover:bg-[#E6F0E2] dark:hover:bg-slate-700`}
                      ${day && new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString() === new Date().toDateString()
                        ? `${primaryButtonBg} ${primaryButtonText} font-semibold hover:${primaryButtonHoverBg} dark:${primaryButtonBg} dark:hover:bg-[#c2d2ba]` // Today
                        : day && new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString() === selectedDate.toDateString()
                        ? `bg-[#E6F0E2] dark:bg-slate-600/80 ${primaryButtonText} dark:text-gray-100 ring-2 ring-[#A9C4A0] dark:ring-[#8aab81]` // Selected
                        : `${primaryButtonText} dark:text-gray-300`
                      }
                      ${!day ? "cursor-default" : ""}
                    `}
                    onClick={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                    disabled={!day}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-xl shadow-lg">
                <h4 className={`text-lg font-semibold mb-3 ${primaryButtonText} dark:text-gray-200`}>Quick Actions</h4>
                <Button variant="outline" className={`w-full justify-start mb-2 border-gray-300 dark:border-slate-600 hover:border-[#A9C4A0] dark:hover:border-[#8aab81] hover:${primaryButtonText} dark:hover:text-gray-100 focus:ring-2 ${primaryButtonFocusRing}`} disabled={!activeSupabaseClient}>
                    <Paperclip size={16} className="mr-2"/> Attach File to Task
                </Button>
                <Button variant="outline" className={`w-full justify-start border-gray-300 dark:border-slate-600 hover:border-[#A9C4A0] dark:hover:border-[#8aab81] hover:${primaryButtonText} dark:hover:text-gray-100 focus:ring-2 ${primaryButtonFocusRing}`} disabled={!activeSupabaseClient}>
                    <Tag size={16} className="mr-2"/> Manage Tags
                </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TodoPage;

"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { reorderTasks } from "@/app/actions/tasks";
import TaskItem, { type Task, type Category } from "@/components/TaskItem";

function SortableTaskItem({
  task,
  categories,
  tagSuggestions,
  dragDisabled,
}: {
  task: Task;
  categories: Category[];
  tagSuggestions: string[];
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      {!dragDisabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-3 shrink-0 touch-none cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <TaskItem task={task} categories={categories} tagSuggestions={tagSuggestions} />
      </div>
    </div>
  );
}

export default function TaskList({
  tasks,
  categories,
  tagSuggestions,
  draggable,
}: {
  tasks: Task[];
  categories: Category[];
  tagSuggestions: string[];
  draggable: boolean;
}) {
  const [items, setItems] = useState(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((task) => task.id === active.id);
    const newIndex = items.findIndex((task) => task.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await reorderTasks(reordered.map((task) => task.id));
    } catch {
      setItems(tasks);
    }
  }

  return (
    <DndContext
      id="task-list-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              categories={categories}
              tagSuggestions={tagSuggestions}
              dragDisabled={!draggable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

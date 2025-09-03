import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const { task, userId } = await request.json()

    if (!task || !userId) {
      return NextResponse.json(
        { error: 'Task and userId are required' },
        { status: 400 }
      )
    }

    // Prepare the task data for Firestore
    const taskData = {
      userId,
      title: task.title,
      description: task.description,
      type: task.type, // 'task' or 'event'
      date: task.date,
      time: task.time,
      priority: task.priority,
      category: task.category,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'calendarTasks'), taskData)
    
    return NextResponse.json({
      success: true,
      taskId: docRef.id,
      message: 'Task added to calendar successfully'
    })

  } catch (error) {
    console.error('Add to calendar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

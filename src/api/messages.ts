import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, timestamp } = req.body;

    // Here you would typically:
    // 1. Validate the message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Invalid message format' });
    }

    // 2. Store in database
    console.log('Received message:', {
      message,
      timestamp,
    });

    // 3. Send to external service if needed
    // await sendToExternalService(message);

    // 4. Return success
    return res.status(200).json({ 
      success: true,
      message: 'Message received successfully' 
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to process message' 
    });
  }
} 
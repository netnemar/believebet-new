'use client';

import { useEffect, useState } from 'react';

const TELEGRAM_BOT_TOKEN = '7918759043:AAHpRMsjE8gCOqBqhOqQB0EKSTNZYZQwyWw';
const TELEGRAM_CHAT_ID = '1154143465'; // Your Telegram user ID

// Store visited state in sessionStorage to avoid duplicate notifications
let hasNotifiedVisit = false;
let hasNotifiedWalletConnect = false;

export async function sendTelegramNotification(message: string, type: 'visit' | 'wallet' | 'action' = 'action') {
  // Check if we already sent a notification of this type during this session
  if (type === 'visit' && hasNotifiedVisit) return false;
  if (type === 'wallet' && hasNotifiedWalletConnect) return false;
  
  // Get IP address
  let ipAddress = 'Unknown';
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    ipAddress = ipData.ip;
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
  }
  
  // Add IP to message
  const messageWithIP = message + `\n🌐 IP: ${ipAddress}`;
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: messageWithIP,
          parse_mode: 'HTML',
        }),
      }
    );
    
    // Mark as notified for this session
    if (type === 'visit') hasNotifiedVisit = true;
    if (type === 'wallet') hasNotifiedWalletConnect = true;
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export default function TelegramNotifier() {
  useEffect(() => {
    // Send page visit notification only once per session
    if (!hasNotifiedVisit) {
      sendTelegramNotification(
        `🔔 <b>New Site Visit</b>\n` +
        `📅 Time: ${new Date().toISOString()}\n` +
        `🔍 Page: ${window.location.pathname}\n` +
        `📱 Device: ${navigator.userAgent}`,
        'visit'
      );
    }
    
    // Only run this effect once when the component mounts
  }, []);

  return null; // This component doesn't render anything
} 
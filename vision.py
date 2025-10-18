import cv2
import pytesseract
import speech_recognition as sr
import pyttsx3
import openai
import numpy as np
import os
from datetime import datetime

# 🔹 Initialize text-to-speech
engine = pyttsx3.init()
engine.say("Vision Assist is now active")
engine.runAndWait()

# 🔹 Initialize voice recognizer
r = sr.Recognizer()

def speak(text):
    print("Assistant:", text)
    engine.say(text)
    engine.runAndWait()

def listen():
    with sr.Microphone() as source:
        print("Listening...")
        audio = r.listen(source)
    try:
        query = r.recognize_google(audio)
        print("You said:", query)
        return query.lower()
    except:
        speak("Sorry, I didn’t catch that.")
        return ""

# 🔹 Function for image detection
def detect_objects():
    cam = cv2.VideoCapture(0)
    speak("Camera is on. Press Q to exit.")
    while True:
        ret, frame = cam.read()
        if not ret:
            break
        cv2.imshow("Vision Assist", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cam.release()
    cv2.destroyAllWindows()
    speak("Camera closed.")

# 🔹 Main program loop
speak("How can I help you?")
while True:
    command = listen()

    if "detect" in command or "camera" in command:
        detect_objects()
    elif "time" in command:
        speak(f"The time is {datetime.now().strftime('%H:%M:%S')}")
    elif "exit" in command or "quit" in command:
        speak("Goodbye Resh!")
        break
    else:
        speak("I'm still learning that command.")

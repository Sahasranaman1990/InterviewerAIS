service InterviewService {
  type QuestionResponse {
  question: String;
}
  action askQuestion() returns QuestionResponse;
   action nextStep(userAnswer: String) returns String;
   action speak(text: String) returns Binary;
   action evaluateInterview(transcript : String) returns String;
}
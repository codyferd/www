export interface Question {
	id: number;
	text: string;
	options: string[];
	correctIndex: number;
}

export interface QuizMeta {
	title: string;
}

export interface QuizWorkspaceData {
	meta: QuizMeta;
	questions: Question[];
}

export interface ScoreReport {
	correct: number;
	percentage: number;
	timeTaken: string;
}

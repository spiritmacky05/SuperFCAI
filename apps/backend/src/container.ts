import { DB } from './db/database.ts';
import { UserModel } from './models/userModel.ts';
import { ReportModel } from './models/reportModel.ts';
import { KnowledgeModel } from './models/knowledgeModel.ts';
import { ErrorReportModel } from './models/errorReportModel.ts';
import { UserService } from './services/userService.ts';
import { ReportService } from './services/reportService.ts';
import { KnowledgeService } from './services/knowledgeService.ts';
import { EmailService } from './services/emailService.ts';
import { ErrorReportService } from './services/errorReportService.ts';
import { AiService } from './services/aiService.ts';
import { PaymongoService } from './services/paymongoService.ts';
import {
  UserController,
  ReportController,
  KnowledgeController,
  ErrorReportController,
  PaymongoController,
  AiController,
  HealthController,
} from './controllers/index.ts';

export const buildContainer = (db: DB) => {
  const userModel = new UserModel(db);
  const reportModel = new ReportModel(db);
  const knowledgeModel = new KnowledgeModel(db);
  const errorReportModel = new ErrorReportModel(db);

  const userService = new UserService(userModel);
  const reportService = new ReportService(reportModel);
  const knowledgeService = new KnowledgeService(knowledgeModel);
  const emailService = new EmailService();
  const errorReportService = new ErrorReportService(errorReportModel, emailService);
  const aiService = new AiService(knowledgeService);
  const paymongoService = new PaymongoService();

  return {
    db,
    controllers: {
      user: new UserController(userService),
      report: new ReportController(reportService),
      knowledge: new KnowledgeController(knowledgeService),
      errorReport: new ErrorReportController(errorReportService),
      paymongo: new PaymongoController(paymongoService),
      ai: new AiController(aiService),
      health: new HealthController(db, aiService),
    },
  };
};

export type AppContainer = ReturnType<typeof buildContainer>;

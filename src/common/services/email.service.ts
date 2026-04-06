import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, userName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3498db;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2980b9;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 20px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .token-box {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sindaval.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </div>
            
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <div class="token-box">
              ${resetUrl}
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este link expira em <strong>1 hora</strong></li>
                <li>Só pode ser usado <strong>uma vez</strong></li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Sindaval - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: 'Sindaval <sindaval.noreply@gmail.com>',
      subject: 'Redefinição de Senha - Sindaval',
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ Email de reset de senha enviado para:', email);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de redefinição de senha');
    }
  }

  async sendPasswordChangedNotification(email: string, userName: string) {

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
          }
          .success {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Senha Alterada</h1>
          
          <p>Olá, <strong>${userName}</strong>!</p>
          
          <div class="success">
            <p><strong>Sua senha foi alterada com sucesso!</strong></p>
          </div>
          
          <p>Se você não realizou esta alteração, entre em contato conosco imediatamente.</p>
          
          <p>Data e hora: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: 'Sindaval <sindaval.noreply@gmail.com>',
      subject: 'Senha Alterada com Sucesso - Sindaval',
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ Notificação de senha alterada enviada para:', email);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }

  async sendNotificationEmail(email: string, userName: string, titulo: string, mensagem: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${titulo}</h1>
          </div>
          
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            
            <p>${mensagem}</p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Sindaval - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: 'Sindaval <sindaval.noreply@gmail.com>',
      subject: `${titulo} - Sindaval`,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ Email de notificação enviado para:', email);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de notificação:', error);
      throw new Error('Falha ao enviar email de notificação');
    }
  }
}

import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.MAIL_USER, // your email
    pass: process.env.MAIL_PASS, // your app password
  },
})

const HR_EMAIL = process.env.HR_EMAIL || "hr@company.com"

export async function POST(request) {
  try {
    const data = await request.json()
    const { userName, date, projects, stats, additionalEmail } = data

    // Email content
    const emailSubject = `Daily Time Report - ${userName} (${date})`
    const emailText = `
Dear HR Manager,

Please find below the daily time report for ${userName} dated ${date}.

Summary:
- Total Tasks: ${stats.totalProjects}
- Total Time Worked: ${stats.totalTime}
- Average Time per Task: ${stats.averageTime}

Tasks completed:
${projects
  .map((project, index) => {
    const startTime = new Date(`2000-01-01T${project.startTime}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const endTime = new Date(`2000-01-01T${project.endTime}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const duration = `${Math.floor(project.duration / 60)}h ${project.duration % 60}m`

    return `${index + 1}. ${project.name} (${startTime} - ${endTime}, Duration: ${duration})`
  })
  .join("\n")}

Best regards,
${userName}

---
This report was generated automatically by the Sense Time Tracker system.
    `

    // Prepare recipients
    const recipients = ['bhavishya.sense@gmail.com']
    if (additionalEmail && additionalEmail.trim()) {
      recipients.push(additionalEmail.trim())
    }

    // Send email
    const mailOptions = {
      from: `"Sense Time Tracker" <${process.env.MAIL_USER}>`,
      to: recipients.join(", "),
      subject: emailSubject,
      text: emailText,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Daily Time Report</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #2c3e50;
                    background-color: #f8f9fa;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    border-radius: 12px;
                    overflow: hidden;
                }
                
                .header {
                    background-color: #ffffff;
                    border-bottom: 1px solid #e9ecef;
                    padding: 30px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 8px;
                }
                
                .header .subtitle {
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 15px;
                }
                
                .header .date {
                    background: #f8f9fa;
                    color: #495057;
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: inline-block;
                    font-size: 13px;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                
                .content {
                    padding: 30px;
                }
                
                .employee-info {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    padding: 20px;
                    margin-bottom: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }
                
                .employee-info h3 {
                    color: #495057;
                    margin-bottom: 12px;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .employee-info p {
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                
                .stats-grid {
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    padding: 20px 12px;
                    border-radius: 12px;
                    text-align: center;
                    flex: 1;
                    min-width: 0;
                    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
                }
                
                .stat-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 6px;
                    display: block;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .stat-label {
                    font-size: 11px;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .section-title {
                    font-size: 18px;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e9ecef;
                    font-weight: 600;
                }
                
                .project-list {
                    margin-bottom: 25px;
                }
                
                .project-item {
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .project-item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                }
                
                .project-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .project-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #2c3e50;
                    flex: 1;
                }
                
                .project-meta {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .time-badge {
                    background: #f8f9fa;
                    color: #495057;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                
                .duration-badge {
                    background: #e9ecef;
                    color: #495057;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }
                
                .project-description {
                    color: #6c757d;
                    font-size: 13px;
                    margin-top: 8px;
                    padding-left: 12px;
                    border-left: 2px solid #e9ecef;
                }
                
                .footer {
                    background: #f8f9fa;
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
                
                .footer p {
                    color: #6c757d;
                    font-size: 13px;
                    margin-bottom: 4px;
                }
                
                .company-logo {
                    margin-bottom: 12px;
                }
                
                .company-logo div {
                    font-size: 18px;
                    color: #495057;
                    font-weight: 600;
                }
                
                @media (max-width: 600px) {
                    .header {
                        padding: 25px 20px;
                    }
                    
                    .content {
                        padding: 25px 20px;
                    }
                    
                    .stats-grid {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .stat-card {
                        padding: 20px 15px;
                    }
                    
                    .stat-number {
                        font-size: 24px;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                    }
                    
                    .project-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .project-meta {
                        width: 100%;
                        justify-content: flex-start;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Daily Time Report</h1>
                    <div class="subtitle">Time Tracking Summary</div>
                    <div class="date">${date}</div>
                </div>
                
                <div class="content">
                    <div class="employee-info">
                        <h3>Employee Information</h3>
                        <p><strong>Name:</strong> ${userName}</p>
                        <p><strong>Report Date:</strong> ${date}</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-number">${stats.totalProjects}</span>
                            <div class="stat-label">Total Tasks</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${stats.totalTime}</span>
                            <div class="stat-label">Total Hours</div>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">${stats.averageTime}</span>
                            <div class="stat-label">Avg. Time</div>
                        </div>
                    </div>
                    
                    <h2 class="section-title">Tasks Completed</h2>
                    <h2 class="section-title">Projects Completed</h2>
                    <div class="project-list">
                        ${projects
                          .map((project, index) => {
                            const startTime = new Date(`2000-01-01T${project.startTime}`).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                            const endTime = new Date(`2000-01-01T${project.endTime}`).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                            const duration = `${Math.floor(project.duration / 60)}h ${project.duration % 60}m`

                            return `
                            <div class="project-item">
                                <div class="project-header">
                                    <div class="project-name">${index + 1}. ${project.name}</div>
                                    <div class="project-meta">
                                        <span class="time-badge">${startTime} - ${endTime}</span>
                                        <span class="duration-badge">${duration}</span>
                                    </div>
                                </div>
                                ${project.description ? `<div class="project-description">${project.description}</div>` : ""}
                            </div>
                            `
                          })
                          .join("")}
                    </div>
                </div>
                
                <div class="footer">
                    <div class="company-logo">
                        <div>Sense Projects Pvt Ltd</div>
                    </div>
                    <p><strong>Generated by:</strong> Sense Time Tracker System</p>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin-top: 12px; font-size: 11px; color: #adb5bd;">
                        This is an automated report. Please contact the system administrator for any questions.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)

    // Prepare success message based on recipients
    let successMessage = "Daily report sent successfully to HR manager"
    if (additionalEmail && additionalEmail.trim()) {
      successMessage = `Daily report sent successfully to HR manager and ${additionalEmail.trim()}`
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
    })
  } catch (error) {
    console.error("Error sending report:", error)
    return NextResponse.json({ error: "Failed to send report: " + error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import puppeteer from "puppeteer"

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.MAIL_USER, // your email
    pass: process.env.MAIL_PASS, // your app password
  },
})

const HR_EMAIL = process.env.HR_EMAIL || "hr@company.com"

// Generate HTML content for the report
function generateHTMLReport(data) {
  const { userName, date, projects, stats } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Daily Project Report - ${userName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
                color: #333;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                margin-bottom: 30px;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                text-align: center;
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
            }
            .timeline {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .project {
                border-left: 3px solid #667eea;
                padding: 15px 20px;
                margin-bottom: 20px;
                background: #f8f9fa;
                border-radius: 0 8px 8px 0;
            }
            .project-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .project-title {
                font-size: 1.2em;
                font-weight: bold;
                color: #333;
            }
            .time-badge {
                background: #667eea;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.9em;
            }
            .duration-badge {
                background: #28a745;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.9em;
                margin-left: 10px;
            }
            .project-description {
                color: #666;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Daily Project Report</h1>
            <h2>${userName}</h2>
            <p>Date: ${date}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.totalProjects}</div>
                <div>Total Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalTime}</div>
                <div>Total Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.averageTime}</div>
                <div>Average Time</div>
            </div>
        </div>

        <div class="timeline">
            <h3>Project Timeline</h3>
            ${projects
              .map((project) => {
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
                <div class="project">
                    <div class="project-header">
                        <div class="project-title">${project.name}</div>
                        <div>
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

        <div class="footer">
            <p>Generated automatically by Project Time Tracker</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
  `
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { userName, date, projects, stats, format } = data

    const htmlContent = generateHTMLReport(data)
    let attachment = null

    if (format === "pdf") {
      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: "networkidle0" })

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      })

      await browser.close()

      attachment = {
        filename: `${userName}_Daily_Report_${date.replace(/\//g, "-")}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }
    } else {
      // HTML format
      attachment = {
        filename: `${userName}_Daily_Report_${date.replace(/\//g, "-")}.html`,
        content: htmlContent,
        contentType: "text/html",
      }
    }

    // Email content
    const emailSubject = `Daily Project Report - ${userName} (${date})`
    const emailText = `
Dear HR Manager,

Please find attached the daily project report for ${userName} dated ${date}.

Summary:
- Total Projects: ${stats.totalProjects}
- Total Time Worked: ${stats.totalTime}
- Average Time per Project: ${stats.averageTime}

Projects completed:
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
This report was generated automatically by the Project Time Tracker system.
    `

    // Send email
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: `bhavishya.sense@gmail.com`,
      subject: emailSubject,
      text: emailText,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Daily Project Report</h2>
          <p><strong>Employee:</strong> ${userName}</p>
          <p><strong>Date:</strong> ${date}</p>
          
          <h3>Summary</h3>
          <ul>
            <li>Total Projects: ${stats.totalProjects}</li>
            <li>Total Time Worked: ${stats.totalTime}</li>
            <li>Average Time per Project: ${stats.averageTime}</li>
          </ul>

          <h3>Projects Completed</h3>
          <ol>
            ${projects
              .map((project) => {
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

                return `<li><strong>${project.name}</strong> (${startTime} - ${endTime}, Duration: ${duration})${project.description ? `<br><em>${project.description}</em>` : ""}</li>`
              })
              .join("")}
          </ol>

          <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
            This report was generated automatically by the Project Time Tracker system.
          </p>
        </div>
      `,
      attachments: [attachment],
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: `${format.toUpperCase()} report generated and sent successfully to HR manager`,
    })
  } catch (error) {
    console.error("Error generating/sending report:", error)
    return NextResponse.json({ error: "Failed to generate and send report: " + error.message }, { status: 500 })
  }
}

package com.eventbridge.service;

import com.eventbridge.model.ODApproval;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PDFService {

    public byte[] generateODLetter(ODApproval odApproval) {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.ITALIC);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.NORMAL);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD);

            // Title Header
            Paragraph title = new Paragraph("EVENT BRIDGE - ON DUTY LETTER", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            Paragraph collegeName = new Paragraph("EXCELSIOR COLLEGE OF ENGINEERING", boldFont);
            collegeName.setAlignment(Element.ALIGN_CENTER);
            collegeName.setSpacingAfter(5);
            document.add(collegeName);

            Paragraph sub = new Paragraph("Generated automatically by Event Bridge Portal", subtitleFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(30);
            document.add(sub);

            // Line separator
            Paragraph line = new Paragraph("------------------------------------------------------------------------------------------------------", bodyFont);
            line.setSpacingAfter(20);
            document.add(line);

            // Details Paragraphs
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

            document.add(new Paragraph("OD REFERENCE ID:   " + "OD-" + odApproval.getId() + "-" + odApproval.getStudent().getId(), boldFont));
            document.add(new Paragraph("Date Generated:    " + (odApproval.getDateApproved() != null ? odApproval.getDateApproved().format(formatter) : "N/A"), bodyFont));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("TO WHOM IT MAY CONCERN", boldFont));
            document.add(Chunk.NEWLINE);

            String bodyText = "This is to certify that " + odApproval.getStudent().getFullName() 
                    + " (Register No: " + odApproval.getStudent().getRegisterNumber() + "), a student of the Department of " 
                    + odApproval.getStudent().getDepartment() + ", has registered and participated in the college event \"" 
                    + odApproval.getEvent().getEventName() + "\", held on " + odApproval.getEvent().getEventDate() + " at " 
                    + odApproval.getEvent().getVenue() + ".\n\n"
                    + "Accordingly, the student has been granted On-Duty (OD) approval for the aforementioned event by the department faculty advisor.";
            Paragraph body = new Paragraph(bodyText, bodyFont);
            body.setLeading(18f);
            document.add(body);

            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            // Approval Status Table
            Table table = new Table(2);
            table.setBorderWidth(1);
            table.setPadding(5);
            table.setSpacing(2);

            Cell cell1 = new Cell(new Phrase("Approval Parameter", boldFont));
            Cell cell2 = new Cell(new Phrase("Value", boldFont));
            table.addCell(cell1);
            table.addCell(cell2);

            table.addCell("Event Name");
            table.addCell(odApproval.getEvent().getEventName());

            table.addCell("Participant Name");
            table.addCell(odApproval.getStudent().getFullName());

            table.addCell("Register Number");
            table.addCell(odApproval.getStudent().getRegisterNumber());

            table.addCell("Approval Faculty");
            table.addCell(odApproval.getFaculty() != null ? odApproval.getFaculty().getFullName() : "N/A");

            table.addCell("Status");
            table.addCell(odApproval.getApprovalStatus());

            document.add(table);

            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);

            // Signatures Section
            Table sigTable = new Table(2);
            sigTable.setBorder(Table.NO_BORDER);
            
            Cell signFaculty = new Cell(new Phrase("________________________\nApproved Faculty Signature", bodyFont));
            signFaculty.setHorizontalAlignment(Element.ALIGN_LEFT);
            signFaculty.setBorder(Cell.NO_BORDER);
            
            Cell signAdmin = new Cell(new Phrase("________________________\nPrincipal / Convener Stamp", bodyFont));
            signAdmin.setHorizontalAlignment(Element.ALIGN_RIGHT);
            signAdmin.setBorder(Cell.NO_BORDER);

            sigTable.addCell(signFaculty);
            sigTable.addCell(signAdmin);
            
            document.add(sigTable);

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}

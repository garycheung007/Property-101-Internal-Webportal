import { GoogleGenAI } from "@google/genai";
import { BodyCorporate } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAgmNotice = async (bc: BodyCorporate, meetingDate: string, meetingTime: string, location: string): Promise<string> => {
  try {
    const prompt = `
      Act as a professional Body Corporate Manager for Property 101 Group Ltd in New Zealand.
      Write a formal "Notice of Intention to Hold an Annual General Meeting" (or Society Meeting if ISOC) for the following property.
      
      Details:
      Identifier: ${bc.bcNumber}
      Property Name: ${bc.name}
      Address: ${bc.address}
      Manager: ${bc.managerName}
      Financial Year End: ${bc.financialYearEnd}
      
      Meeting Details:
      Date: ${meetingDate}
      Time: ${meetingTime}
      Location: ${location}
      Venue Address: ${bc.nextAgmVenueAddress || location}
      
      Relevant Deadlines (if available):
      NOI Response Due Date: ${bc.noiResponseDueDate || 'As per standard act compliance'}
      Motions Due By: ${bc.motionsDueBy || 'As per standard act compliance'}
      
      The notice should be formal, professional, and compliant with the Unit Titles Act 2010 (or Inc Societies Act 2022 if applicable).
      It should clearly state "Property 101 Group Ltd" as the management company.
      
      Include standard agenda items such as:
      1. Election of Chairperson
      2. Financial Statements (FYE ${bc.financialYearEnd})
      3. Budget Approval
      4. Insurance Renewal (Current expires: ${bc.insuranceExpiry})
      5. Building Warrant of Fitness (Current expires: ${bc.bwofExpiry || 'N/A'})
      6. Long Term Maintenance Plan Review (Next renewal: ${bc.nextLtmpRenewalDate || 'N/A'})
      
      Output the text in a clean Markdown format suitable for copying into an email or Word document.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating AGM notice:", error);
    throw new Error("Could not generate notice. Please check your API key.");
  }
};

export const analyzeComplianceStatus = async (bc: BodyCorporate): Promise<string> => {
    try {
        const prompt = `
            Act as a compliance officer for Property 101 Group Ltd.
            Analyze the following Body Corporate status and provide a brief executive summary of risks.
            Current Date: ${new Date().toISOString().split('T')[0]}
            
            Data:
            Property: ${bc.name} (${bc.bcNumber})
            Insurance Expiry: ${bc.insuranceExpiry} (Broker: ${bc.insuranceBroker || 'Unknown'})
            Valuation Due: ${bc.nextValuationDue || 'N/A'}
            BWOF Expiry: ${bc.bwofExpiry || 'N/A'} (Compliance Co: ${bc.complianceCompany || 'Unknown'})
            Financial Year End: ${bc.financialYearEnd}
            AGM Date: ${bc.nextAgmDate || 'Not Set'}
            LTMP Renewal: ${bc.nextLtmpRenewalDate || 'N/A'}
            H&S Report: ${bc.hsReportDate || 'N/A'}
            
            Provide a 3-5 bullet point summary of immediate actions required by the manager. Focus on dates that are overdue or coming up within 3 months.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "No analysis available.";
    } catch (error) {
        console.error("Error analyzing compliance:", error);
        return "Unable to perform AI analysis at this time.";
    }
}

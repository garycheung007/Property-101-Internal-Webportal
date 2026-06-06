import { DocumentTemplates } from '../types';

export const CHAIRPERSON_TABLE_HTML = `
<table style="border-collapse: collapse; width: 100%; margin-bottom: 8pt; font-size: 10pt; font-weight: normal;">
    <tbody>
        <tr style="background-color: #f1f5f9;"><th style="border: 1px solid #000; padding: 6pt; text-align: left;" width="65%">Name:</th><th style="border: 1px solid #000; padding: 6pt; text-align: left;">Unit Number:</th></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 35pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
    </tbody>
</table>`;

export const COMMITTEE_TABLE_HTML = `
<table style="border-collapse: collapse; width: 100%; margin-bottom: 8pt; font-size: 10pt; font-weight: normal;">
    <tbody>
        <tr style="background-color: #f1f5f9;"><th style="border: 1px solid #000; padding: 6pt; text-align: left;" width="65%">Name:</th><th style="border: 1px solid #000; padding: 6pt; text-align: left;">Unit Number:</th></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 28pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 28pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 28pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 28pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 6pt; height: 28pt;"></td><td style="border: 1px solid #000; padding: 6pt;"></td></tr>
    </tbody>
</table>`;

export const PAGE_BREAK_SNIPPET = `<div class="page-break" style="page-break-after: always; mso-special-character:page-break; border-top: 2px dashed #db2777; margin: 24pt 0; position: relative; height: 0;" contenteditable="false"><span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fdf2f8; border: 1px solid #db2777; padding: 2px 10px; font-size: 8pt; color: #db2777; font-weight: bold; font-family: sans-serif; border-radius: 4px; white-space: nowrap;">PAGE BREAK</span></div>`;

const NOI_LETTER_BC = `{{header}}
<p>{{current_date}}</p>
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-bottom: 15pt;">
  <tr>
      <td style="border: none; padding: 0;">
          <p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;">The Proprietors<br/>Body Corporate {{bc_number}}<br/>{{address}}</p>
      </td>
  </tr>
</table>
<p>Dear Owners</p>
<p><strong>Body Corporate {{bc_number}} - {{bc_name}}</strong></p>
<p><strong>Notice of Intention to call the {{meeting_type}} {{meeting_day}}, {{meeting_date}} at {{meeting_time}}</strong></p>
<p>We are pleased to confirm that your {{meeting_type}} has been scheduled for <strong>{{meeting_day}}, {{meeting_date}} at {{meeting_time}}</strong>. The meeting will be held in-person at <strong>{{venue}}</strong>, although remote access will be available via Zoom on request in advance.</p>
<p><strong>Chairperson Election:</strong></p>
<p>In accordance with the Unit Titles Act you are entitled to provide nominations for the chairperson. A candidate for election as a chairperson must be nominated by another unit owner in the unit title development and must be the owner of a principal unit or a director nominated by the candidate in accordance with Regulation 3 of the Unit Titles Regulations 2011 to act as chairperson on the candidate's behalf.</p>
<p><strong>Committee Election:</strong></p>
<p>In addition, you are entitled to provide nominations for the committee. A candidate for election as a committee member must be the owner of a principal unit in the unit title development or a person nominated by the candidate in accordance with Regulation 24(4) of the Unit Titles Regulations 2011 to act as a committee member on the candidate's behalf.</p>
<p>Please complete and return the attached <strong>AGM Response Form</strong> to Property 101 Group Ltd by email info@prop101.co.nz no later than {{noi_due_date}} at {{noi_due_time}}.</p>
<p>Yours sincerely</p>
<p>{{manager_signature}}</p>
<p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;"><strong>{{manager_name}}</strong><br/>{{manager_title}}<br/>Property 101 Group Limited</p>
{{footer}}`;

const RESPONSE_FORM_BC = `{{header}}
<p>To: <strong>Body Corporate {{bc_number}} - {{bc_name}}</strong><br>
c/- Property 101 Group Limited<br>
PO Box 11355, Ellerslie<br>
AUCKLAND 1542</p>

<p><strong>{{meeting_type}} {{meeting_day}} {{meeting_date}} at {{meeting_time}}</strong></p>

<p><u><strong>Nominations for Officers:</strong></u></p>

<p>1. I nominate the following owner for Body Corporate <strong>Chairperson</strong> (with their prior consent):</p>
${CHAIRPERSON_TABLE_HTML}

<p style="font-weight: normal;">I confirm that I have contacted the above person who has accepted the nomination and I am not nominating myself or someone on my unit title [ &nbsp; ]</p>

<p style="font-size: 9pt; font-style: italic; font-weight: normal;">(Please note if an above nominee is successfully appointed Body Corporate Chairperson they will automatically be on the Committee. They will also be the Committee Chair unless the Body Corporate resolves otherwise. However, to ensure your nominee is on the Committee (should their Chairperson nomination not be successful) please also insert them as a Committee nominee below)</p>

<p>2. I nominate the following owner(s) for the <strong>Committee</strong> (with their prior consent):</p>
${COMMITTEE_TABLE_HTML}

<p style="font-weight: normal;">I confirm that I have contacted the above person/s who has/have accepted the nomination [ &nbsp; ]</p>

<p style="font-size: 9pt; font-style: italic; font-weight: normal;">(Please ensure that where a Committee nominee above is an employee of a unit owner company they have obtained director authorisation. Please state both the name of the employee and the unit owner company above.)</p>

<p style="font-weight: normal;">I acknowledge that if a nominee has unpaid levies or other amounts owing to the Body Corporate at the day/time nominations close, their nomination cannot be accepted.</p>

<p><u><strong>Matters for discussion:</strong></u></p>

<p style="font-weight: normal;">_____________________________________________________________________________________________</p>
<p style="font-weight: normal;">_____________________________________________________________________________________________</p>

<br>
<p style="font-weight: normal;"><strong>Signed:</strong> _________________________________________________________________________________</p>
<p style="font-weight: normal;"><strong>Name:</strong> _________________________________________________________________________________</p>
<p style="font-weight: normal;"><strong>Unit Number:</strong> __________________________________________________________________________</p>

{{deadline_footer}}

<p style="text-align: center; font-weight: bold; margin-top: 10pt;">Please return to email: <a href="mailto:info@prop101.co.nz">info@prop101.co.nz</a></p>
{{footer}}`;

const NOI_LETTER_ISOC = `{{header}}
<p>{{current_date}}</p>
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: none; margin-bottom: 15pt;">
  <tr>
      <td style="border: none; padding: 0;">
          <p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;">The Members<br/>Incorporated Society {{bc_number}}<br/>{{address}}</p>
      </td>
  </tr>
</table>
<p>Dear Members</p>
<p><strong>Incorporated Society {{bc_number}} - {{bc_name}}</strong></p>
<p><strong>Notice of Intention to call the {{meeting_type}} {{meeting_day}}, {{meeting_date}} at {{meeting_time}}</strong></p>
<p>We are pleased to confirm that your {{meeting_type}} has been scheduled for <strong>{{meeting_day}}, {{meeting_date}} at {{meeting_time}}</strong>. The meeting will be held in-person at <strong>{{venue}}</strong>, although remote access will be available via Zoom on request in advance.</p>
<p><strong>Committee Election:</strong></p>
<p>In accordance with the Incorporated Societies Act 2022 and the Society's Constitution, you are entitled to provide nominations for the committee. A candidate for election as a committee member must be a member of the society and must be nominated by another member.</p>
<p>Please complete and return the attached <strong>Meeting Response Form</strong> to Property 101 Group Ltd by email info@prop101.co.nz no later than {{noi_due_date}} at {{noi_due_time}}.</p>
<p>Yours sincerely</p>
<p>{{manager_signature}}</p>
<p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;"><strong>{{manager_name}}</strong><br/>{{manager_title}}<br/>Property 101 Group Limited</p>
{{footer}}`;

const RESPONSE_FORM_ISOC = `{{header}}
<p>To: <strong>Incorporated Society {{bc_number}} - {{bc_name}}</strong><br>
c/- Property 101 Group Limited<br>
PO Box 11355, Ellerslie<br>
AUCKLAND 1542</p>

<p><strong>{{meeting_type}} {{meeting_day}} {{meeting_date}} at {{meeting_time}}</strong></p>

<p><u><strong>Nominations for Committee:</strong></u></p>

<p>I nominate the following member(s) for the <strong>Committee</strong> (with their prior consent):</p>
${COMMITTEE_TABLE_HTML}

<p style="font-weight: normal;">I confirm that I have contacted the above person/s who has/have accepted the nomination [ &nbsp; ]</p>

<p style="font-weight: normal;">I acknowledge that if a nominee has unpaid levies or other amounts owing to the Society at the day/time nominations close, their nomination cannot be accepted.</p>

<p><u><strong>Matters for discussion:</strong></u></p>

<p style="font-weight: normal;">_____________________________________________________________________________________________</p>
<p style="font-weight: normal;">_____________________________________________________________________________________________</p>

<br>
<p style="font-weight: normal;"><strong>Signed:</strong> _________________________________________________________________________________</p>
<p style="font-weight: normal;"><strong>Name:</strong> _________________________________________________________________________________</p>
<p style="font-weight: normal;"><strong>Unit Number:</strong> __________________________________________________________________________</p>

{{deadline_footer}}

<p style="text-align: center; font-weight: bold; margin-top: 10pt;">Please return to email: <a href="mailto:info@prop101.co.nz">info@prop101.co.nz</a></p>
{{footer}}`;

const S146 = `<p>{{current_date}}</p>
<p>{{owner_name}}</p>
<p>{{owners_address}}</p>
<br/>
<p><strong>Re: BC{{bc_number}} - {{bc_name}} - {{address}} / PU {{unit_number}}</strong></p>
<p>Further to your request, please find the following:</p>
<p style="margin-left: 10pt;">
a) Pre-Contract Disclosure Statement.<br/>
b) Our Fee invoice.<br/>
c) Financial Statements and/or Audit Reports for the last 3 years.<br/>
d) General Meeting Notices & Minutes for the last 3 years (including supporting documentation).<br/>
e) Committee Meeting Minutes for the last 3 years.<br/>
f) Long term Maintenance Plan.<br/>
g) Remediation Reports (if any).<br/>
h) Certificate of Insurance & Policy details.<br/>
i) Body Corporate Rules.</p>
<p>Please note insurance notings can be made direct through the brokers, {{insurance_noting}}</p>
<p>{{remediation_text}}</p>
<p>Yours faithfully</p>
<p>{{manager_signature}}</p>
<p><strong>{{manager_name}}</strong><br/>{{manager_title}}<br/>Email: {{manager_email}}</p>

${PAGE_BREAK_SNIPPET}

<p style="text-align: center; font-size: 14pt; font-weight: bold;">Pre-contract Disclosure Statement</p>
<p style="text-align: center; font-size: 10pt;">146, Unit Titles Act 2010 and reg 33 (1), Unit Titles Regulations 2011</p>
<p style="text-align: center; font-weight: bold; font-size: 11pt;">Sale of an Existing Unit in a Unit Title Development</p>
<br/>
<table border="0" width="100%" style="border: none;">
    <tr><td width="40%" style="font-weight: bold; border: none;">Date Prepared:</td><td style="border: none;">{{current_date}}</td></tr>
    <tr><td style="font-weight: bold; border: none;">Unit Plan:</td><td style="border: none;">{{bc_number}}</td></tr>
    <tr><td style="font-weight: bold; border: none;">Body Corporate name and number:</td><td style="border: none;">{{bc_name}} - BC{{bc_number}}</td></tr>
    <tr><td style="font-weight: bold; border: none;">Unit number:</td><td style="border: none;">{{unit_number}}</td></tr>
</table>
<br/>
<p style="font-weight: bold;">Pre-contract Disclosure Statement</p>
<p>(1) The information prescribed for section 146(2) of the Act (which requires a Pre-Contract Disclosure Statement to contain prescribed information set out in Regulation 33(1)) where the Pre-Contract Disclosure Statement is provided in relation to a sale and purchase of a unit other than an "off-the-plan" unit. The information contained in this statement is provided to the extent it is capable of being provided in relation to the unit title development:</p>
<p>(a) Does the body corporate or body corporate committee have actual knowledge that any part of the unit title development has-</p>
<div style="margin-left: 20pt;">
  <p>(i) weathertightness issues for which a claim has been made under the Weathertight Homes Resolution Services Act 2006: <b>{{weathertightness_claim}}</b>; or</p>
  <p>(ii) weathertightness issues that have been remediated without a claim under that Act or other proceedings before a court or tribunal: <b>{{weathertightness_remediated}}</b>; or</p>
  <p>(iii) weathertightness issues that have not been remediated: <b>{{weathertightness_not_remediated}}</b>; or</p>
  <p>(iv) earthquake-prone issues; <b>{{earthquake_prone}}</b>; or</p>
  <p>(v) any other significant defects in the land (including the unit title development and the land on which it is situated) that may require remediation: <b>{{any_other_significant_defects}}</b></p>
</div>
<p>(b) If the body corporate is involved in any proceedings in any court or tribunal: <b>{{proceedings_in_court}}</b>: and, if so, details of the proceedings: not applicable.</p>
<p>(c) Audit reports (if available) for those of the previous 3 years for which an audit was carried out, and a financial statement of the years in that time period for which no audit was carried out are <b>ATTACHED</b>.</p>
<p>(d) The notices and minutes of general meetings of the body corporate and the body corporate committee for the previous 3 years: (i) including all supporting documentation; but (ii) excluding any information that may be redacted for the reasons specified in regulation 27A(2); are <b>ATTACHED</b>.</p>
<p>(e) The name and contact details of the body corporate manager is as follows: <b>Property 101 Group C/- {{manager_name}}</b>, Email: {{manager_email}}</p>
<p>(f) The 12 month period comprising the current financial year for the purposes of the financial statements of the body corporate is <b>{{fy_start}} to {{fy_end}}</b>.</p>
<p>(g) The body corporate levies payable for the unit for the current financial year is <b>\${{unit_levy}}</b> inclusive of GST to {{fy_end}}.</p>
<p>(h) (i) The details of maintenance that the body corporate proposes to carry out in the unit title development in the year following the date of this disclosure statement are as discussed/agreed by the committee and at general meetings; and (ii) The body corporate proposes to meet the cost of that maintenance as agreed by the committee and at general meetings.</p>
<p>(i) The balance of every fund or bank account held or operated by or on behalf of the body corporate as at the date of the last financial statement being the <b>{{last_financial_statement}}</b> are as follows:</p>
<div style="margin-left: 20pt;">
  <p>(i) Operating fund: <b>{{operating_fund_balance}}</b></p>
  <p>(ii) Reserve fund(s): <b>{{reserve_fund_balance}}</b></p>
</div>
<p>(j) A copy of the long-term maintenance plan dated <b>{{ltmp_last_renewal}}</b> is <b>ATTACHED</b>.</p>
<p>(k) Any proposed works under the long-term maintenance plan for the unit title development to be carried out or begun within the next 3 years and the estimated costs of the works as per the plan.</p>
<p>(l) The next review date for the long-term maintenance plan for the unit title development is <b>{{ltmp_next_renewal}}</b>. / The next review date for the long-term maintenance plan for the unit title development is overdue and the Committee is currently arranging for an updated LTMP to ensure compliance with the Unit Titles Amendment Act 2022.</p>
<p>(m) Any remediation reports commissioned by the body corporate within the preceding three years are <b>ATTACHED</b>.</p>
<p>(n) A summary of the insurance cover the body corporate maintains for the unit title development are <b>ATTACHED</b> & the Insurance Brokers Contact details are:</p>
<p>Please note insurance notings can be made direct through the brokers, {{insurance_noting}}</p>

${PAGE_BREAK_SNIPPET}

<p style="font-weight: bold; text-decoration: underline;">General Information</p>
<p>(i) This document contains brief explanations of information relevant to the purchase of a unit title property. It is highly recommended that the buyer obtains independent legal advice by consulting their legal representatives about any information contained in this statement and before signing a contract to buy in a unit title development.</p>
<p>Further information on buying, selling, or having a unit plan can be obtained from the Tenancy Services website. Unit Title Services also has available various publications on unit title properties that may be of assistance, or you can contact the Ministry of Business, Innovation and Employment on 0800 UNIT TITLES.</p>
<p style="font-weight: bold;">Unit Title Property Ownership:</p>
<p>(ii) A body corporate comprises all unit owners in a unit title development. Unit titles are a common form of multi-unit ownership and allow owners to own an area of land and/or part of a building and share the common property with other unit owners.</p>
<p>There are various rights and responsibilities that differ to the more traditional house and land ownership structure.</p>
<p>Unit title ownership has a body corporate structure where decisions about the units and the common property need to be made by the owners working as a collective. The main governing legislation for unit title properties is the Unit Titles Act 2010 ("Act") and its Regulations.</p>
<p>Generally, a body corporate may arrange maintenance and upkeep of the building, the building insurance, general amenities, such as rubbish collection and gardening etc of common areas as agreed upon by the owners. The funding of a body corporate is by levies that are attached to each unit. Levies are collected for the general upkeep of the building and its amenities as well as for long-term maintenance of the complex.</p>
<p>The long-term maintenance plan of the complex is required under the Act and its Regulations to be for a minimum period of 10 years. From 8 May 2024 the minimum period for complexes with 10 or more principal units is 30 years.</p>
<p>All complexes have their own particular rules for the management of the complex known as the body corporate operational rules.</p>
<p>Each year, the body corporate must hold an AGM for decisions to be made about the units and the common areas of the complex. There may be further meetings during the year depending on the nature of the complex, its structure, or any issues that it may be experiencing. Sometimes an EGM may need to be held if there is a particular reason for holding a meeting outside of an AGM. There may also be committee meetings held throughout the year.</p>

${PAGE_BREAK_SNIPPET}

<p style="font-weight: bold;">Unit Plan:</p>
<p>(iii) Every unit title development has a unit plan, which shows the location of the principal units as well as any accessory units and common property in the development. The depositing of the unit plan with Land Information New Zealand (LINZ) forms the body corporate. The unit plan is a formal record showing the boundaries of the principal units, any accessory units and common property in the development.</p>
<p style="font-weight: bold;">Ownership and Utility Interest:</p>
<p>(iv) Every principal unit and every accessory unit must be assigned an ownership interest. Every proposed principal unit and every proposed accessory unit must be assigned a proposed ownership interest.</p>
<p style="font-weight: bold; margin-left: 10pt;">Ownership Interest:</p>
<p>The ownership interest or proposed ownership interest is fixed by a registered valuer on the basis of the relative value of the unit in relation to each of the other units and shown on documentation required to be lodged with the unit plan (including staged and complete unit plans).</p>
<p>The ownership interest is used to determine a range of matters including, but not limited to:</p>
<ul style="margin-left: 20pt;">
  <li>The beneficial interest of the owner of the principal unit in the common property.</li>
  <li>The share of the owner of the principal unit in the value of any buildings, fixtures, and other improvements in relation to leasehold land.</li>
  <li>The voting rights of the owner of the principal unit when a poll is requested under s99 of the Act.</li>
  <li>The share of the owner of the principal unit in the underlying fee simple in the land on the cancellation of the unit plan.</li>
  <li>The extent of the obligation of the owner of the principal unit in respect of contributions levied by the body corporate under s 121 of the Act in respect of any capital improvement fund.</li>
  <li>The rights of the owner of the principal unit in relation to a distribution of any surplus money of a capital improvement fund under s 131 of the Act.</li>
  <li>The extent of the obligation of the owner of the principal unit for payment of ground rental under s 87 of the Act.</li>
  <li>The extent of the liability of the owner of the principal unit for payment of ground rental under s 87 Unit Titles Act.</li>
  <li>The extent of the liability of the owner of the principal unit for damages and costs under s 142 of the Act.</li>
</ul>

${PAGE_BREAK_SNIPPET}

<p>The proposed ownership interest for a future development unit is the total of all the proposed ownership interests of the proposed principal units and proposed accessory units in the future development unit assigned under s 38(1)(6) of the Act.</p>
<p>The proposed ownership interest is used to determine the same range of matters described in s 38(3) of the Act in so far as they apply to an owner of a future development unit.</p>
<p>Subject to ss 41, 67, 69(3), and 177 of the Act no change may be made in the ownership interest of any unit after the unit plan is deposited.</p>
<p style="font-weight: bold; margin-left: 10pt;">Utility Interest:</p>
<p>Before a unit plan is deposited under ss 17(1), 21(1) or 24(2)(a) of the Act, every principal unit and every accessory unit must be assigned a utility interest.</p>
<p>The utility interest is the same as the ownership interest fixed under s 38(2) unless it is otherwise specified on the deposit of the unit plan or subsequently changed and is used to calculate how much each owner contributes to the operational costs of the body corporate.</p>
<p>The utility interest is used to determine a range of matters including, but not limited to:</p>
<ul style="margin-left: 20pt;">
  <li>The extent of the obligation of the owner of the principal unit in respect of the contributions levied by the body corporate under s 121 in respect of the long-term maintenance fund, the optional contingency fund, and the operating account.</li>
  <li>The rights of the owner of the principal unit in relation to a distribution of any surplus money in the long-term maintenance fund, the optional contingency fund, or the operating account, or personal property of the body corporate under s 131.</li>
</ul>

${PAGE_BREAK_SNIPPET}

<p style="font-weight: bold;">Body Corporate Operational Rules:</p>
<p>(v) The Unit Titles Act 2010 and its Regulations states that a body corporate can prescribe operational rules for the development, which are incidental rights and obligations that apply to the unit owners and body corporate alike. Bodies corporate can amend, add to or revoke these operational rules by ordinary resolution, as long as any amendments are not inconsistent with any provision of the Act. Section 106 of the Act details further restrictions on the scope of amendments or additions to body corporate operational rules.</p>
<p>If a Body Corporate has adopted a bespoke set of operational rules for the development, they will be registered on the supplementary record sheet for the development. If not, then generally the default rules in Schedule 1 of the Regulations will apply.</p>
<p>All unit owners, occupiers, and residents (including tenants) must comply with the body corporate operational rules for the complex.</p>
<p style="font-weight: bold;">Pre-settlement Disclosure:</p>
<p>(vi) The seller must provide their buyer with a Pre-settlement Disclosure Statement no later than the fifth working day before the settlement date. The Pre-settlement Disclosure Statement must contain the following prescribed information and a certificate given by the body corporate certifying that the information in the statement is correct. The body corporate may withhold the certificate if any debt that is due to the body corporate remains unpaid. The prescribed information is:</p>
<div style="margin-left: 20pt;">
  <p>(a) the unit number; and<br/>
  (b) the body corporate number; and<br/>
  (c) the amount of the contribution levied by the body corporate under s. 121 of the Act in respect of the unit being sold; and<br/>
  (d) the period covered by such contribution; and<br/>
  (e) the manner of payment of the levy; and<br/>
  (f) the date on or before which payment of the levy is due; and<br/>
  (g) whether a levy, or part of a levy, due to the body corporate is unpaid and, if so, the amount of the unpaid levy; and<br/>
  (h) whether legal proceedings have been instituted in relation to any unpaid levy; and</p>
</div>

${PAGE_BREAK_SNIPPET}

<div style="margin-left: 20pt;">
  <p>(i) whether any metered charges due to the body corporate are unpaid and, if so, the amount of unpaid metered charges; and<br/>
  (j) whether any costs relating to repairs to building elements or infrastructure contained in the unit are unpaid and, if so, the amount of unpaid costs; and<br/>
  (k) the rate at which interest is accruing on any money owing to the body corporate by the seller; and<br/>
  (l) whether there are any proceedings pending against the body corporate in any court or tribunal; and<br/>
  (m) whether there have been any changes to the body corporate operational rules since the Pre-Contract Disclosure Statement.<br/>
  (n) whether there are any proceedings: -<br/>
  &nbsp;&nbsp;(i) initiated by the body corporate and pending in any Court or Tribunal; or<br/>
  &nbsp;&nbsp;(ii) intended to be initiated by the body corporate in any Court or Tribunal.<br/>
  (o) whether there is any written claim by the body corporate against a third party that is not yet to be resolved.</p>
</div>
<p>There are legal consequences on the seller for failing to provide the Pre-settlement Disclosure Statement in the timeframes required by the Unit Titles Act 2010, including delay of settlement and cancellation of the contract.</p>
<p style="font-weight: bold;">Record of Title:</p>
<p>(vii) A record of title was previously known as a certificate of title for a unit title development. A record of title records the ownership of a unit and contains a legal description of the unit's boundaries. It further records any legal interest registered against the title to the unit, such as a mortgage or an easement.</p>
<p>A copy of the record of title for the unit should come with the unit plan attached and a supplementary record sheet that records the ownership of the common property, and any legal interests against the common property and base land. It also records other information, such as address for service of the body corporate and the body corporate operational rules. In a unit title development, the common property does not have a record of title.</p>
<p style="font-weight: bold;">Land Information Memorandum (LIM):</p>
<p>(viii) A LIM is a report issued by the relevant council by request. The purchaser may request a LIM to obtain certain information and there are fees associated for its request payable to the relevant council. A LIM provides information the council has about the property. This may include:</p>
<ul style="margin-left: 20pt;">
  <li>rates information;</li>
  <li>information about private and public storm water and sewerage drains;</li>
  <li>what building consents and code compliance certificates have been issued;</li>
  <li>the district plan classification that relates to the land and its buildings;</li>
  <li>any special features of the land the council is aware of, including downhill movement, gradual sinking, rock fall, flooding etc;</li>
  <li>any possible contamination of the land; and</li>
  <li>any other information the council deems relevant/necessary.</li>
</ul>
<p>Full details of what a local council is obliged to provide in a LIM is contained in s 44A of the Local Government Official Information and Meetings Act 1987.</p>

${PAGE_BREAK_SNIPPET}

<p style="font-weight: bold;">Easements and Covenants:</p>
<p>(ix) Easement: An easement is a right that is granted over a piece of land in favour of nearby land. The right may not extend as far as giving exclusive possession of the land. There are various forms of easement and this may include common easements allowing services such as water, sewage, electricity or telephone lines and rights of way that run over defined areas of the land. An easement may apply to a unit title property and/ or to the common areas.</p>
<p>Covenant: A title may record a covenant on the property. A covenant is an interest in land according to the Property Law Act 2007 and is registered on the title of a property. The intent of a covenant is to limit or restrict the owner and any future owners as to how they use the land or property. Some covenants may be private agreements between parties; others may be imposed by the Council. Developers may use private covenants for controlling how future owners both develop and maintain the land, particularly for residential developments that are being marketed with certain characteristics.</p>
<p>Further information about matters set out above can be obtained from:</p>
<table width="100%" border="1" style="border-collapse: collapse; margin-top: 10pt;">
  <tr><td style="padding: 10pt; font-weight: bold;">Unit title property ownership</td><td style="padding: 10pt;">Ministry of Business, Innovation and Employment<br/><a href="https://www.unittitles.govt.nz">www.unittitles.govt.nz</a><br/>0800 UNIT TITLES (0800 864 884)</td></tr>
  <tr><td style="padding: 10pt; font-weight: bold;">Unit plan<br/>Ownership and utility interests<br/>Record of Title<br/>Easements and covenants</td><td style="padding: 10pt;">Land Information New Zealand<br/><a href="https://www.linz.govt.nz">www.linz.govt.nz</a><br/>0800 ONLINE (0800 665 463)</td></tr>
  <tr><td style="padding: 10pt; font-weight: bold;">Body corporate operational rules<br/>Pre settlement disclosure statement</td><td style="padding: 10pt;">The body corporate of the unit title development</td></tr>
  <tr><td style="padding: 10pt; font-weight: bold;">Land Information Memorandum</td><td style="padding: 10pt;">Your local council</td></tr>
</table>

${PAGE_BREAK_SNIPPET}

<br/>
<p>Signed: __________________________ &nbsp;&nbsp; Date: {{current_date}}</p>
<p>By the seller or their authorised person</p>
<br/>
<p style="font-weight: bold;">Disclaimer:</p>
<p>This pre-contract disclosure statement has been prepared by Property 101 Group Ltd ("Prop101") on behalf of the vendor pursuant to s146 of the Unit Titles Act 2010. While Prop101 endeavors to ensure that all information in this statement is accurate, Prop101 makes no claims, promises, or guarantees about the accuracy, completeness, or adequacy of the information contained in this statement. Prop101 expressly disclaims all liability for any loss arising from reliance on any information contained in this statement.</p>
<p>To the best of Prop101's knowledge and belief at the time of preparation of this disclosure statement, the contents of this disclosure are true and correct. Where any information in this disclosure statement has been provided by or derives from the information or data held by the body corporate or Prop101, this information is provided strictly on the basis that the body corporate, the committee and Prop101 have no liability beyond their statutory responsibilities in the Act.</p>
{{footer}}`;

const S147 = `{{header}}
<p>{{current_date}}</p>
<p><strong>PRE-SETTLEMENT DISCLOSURE STATEMENT</strong></p>
<p>Section 147, Unit Titles Act 2010</p>
<br/>
<p><strong>Body Corporate:</strong> {{bc_name}} ({{bc_number}})</p>
<p><strong>Unit:</strong> {{unit_number}}</p>
<p><strong>Owner:</strong> {{owner_name}}</p>
<br/>
<p>The Body Corporate certifies that the following information is correct for the unit as at the date of this statement:</p>
<p>1. The amount of the contribution levied by the body corporate under section 121 of the Act in respect of the unit is \${{unit_levy}} per annum.</p>
<p>2. The period covered by this contribution is from {{fy_start}} to {{fy_end}}.</p>
<p>3. The manner of payment: [Insert Payment Details]</p>
<p>4. The amount currently owing: $0.00</p>
<br/>
<p>Yours sincerely,</p>
<p>{{manager_signature}}</p>
<p style="margin-bottom: 0pt; mso-margin-bottom-alt: 0pt;"><strong>{{manager_name}}</strong><br/>{{manager_title}}<br/>Property 101 Group Limited</p>
{{footer}}`;

const CPL = `{{header}}
<p>{{current_date}}</p>
<h1 style="text-align: center;">CERTIFICATE OF PUBLIC LIABILITY</h1>
<br/>
<p><strong>TO WHOM IT MAY CONCERN</strong></p>
<p><strong>Re: {{bc_name}} ({{bc_number}}) - {{address}}</strong></p>
<br/>
<p>We, Property 101 Group Ltd as Managers of the above named property, confirm that a Public Liability Insurance policy is in place with the following details:</p>
<table width="100%" border="1" style="border-collapse: collapse;">
  <tr><td style="padding: 10px; font-weight: bold;">Insurer:</td><td style="padding: 10px;">{{insurance_underwriter}}</td></tr>
  <tr><td style="padding: 10px; font-weight: bold;">Policy Number:</td><td style="padding: 10px;">[Policy Number]</td></tr>
  <tr><td style="padding: 10px; font-weight: bold;">Expiry Date:</td><td style="padding: 10px;">{{insurance_expiry}}</td></tr>
  <tr><td style="padding: 10px; font-weight: bold;">Public Liability Limit:</td><td style="padding: 10px;">[Limit of Indemnity]</td></tr>
</table>
<br/>
<p>This certificate is issued as a matter of information only and confers no rights upon the certificate holder. This certificate does not amend, extend or alter the coverage afforded by the policy listed above.</p>
<br/>
<p>Yours faithfully,</p>
<p>{{manager_signature}}</p>
<p><strong>{{manager_name}}</strong><br/>Body Corporate Manager</p>
{{footer}}`;

export const DEFAULT_CONFLICT_REGISTER_TEMPLATE = `<table style="width:100%;border-collapse:collapse;margin-bottom:8pt;"><tr><td style="vertical-align:top;"><p style="font-weight: bold; font-size: 14pt; margin-bottom: 6pt;">{{BC_NAME}} (BC{{BC_NUMBER}})</p><h2 style="font-size: 13pt; font-weight: bold; margin-bottom: 12pt;">Register of interests &#8211; Committee members</h2></td><td style="vertical-align:top;text-align:right;width:200px;"><img src="data:image/jpeg;base64,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" style="height:70px;object-fit:contain;" /></td></tr></table>
<p style="font-size: 10pt; font-weight: bold; margin-bottom: 16pt;">The Committee member/s with a financial conflict of interest may complete columns 1 to 4 (or the Committee may wish to). The Committee completes columns 5 and 6.</p>
<p style="font-size: 9pt; color: #555; margin-bottom: 16pt;">Generated: {{GENERATED_DATE}}</p>
<table style="border-collapse: collapse; width: 100%; font-size: 9pt;">
  <thead>
    <tr style="background-color: #cccccc;">
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 4%;">1</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 20%;">2</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 25%;">3</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 10%;">4</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 20%;">5</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: center; width: 21%;">6</th>
    </tr>
    <tr style="background-color: #cccccc;">
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;"><strong>Name</strong> of Committee member</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;"><strong>Body Corporate matter</strong> being considered by the Committee that triggers the Committee member&#8217;s financial conflict of interest &#8211; <em>&#8220;matter&#8221; as defined in section 114C(5) Unit Titles Act 2010</em></th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;">Nature and extent of the <strong>Committee members&#8217; financial conflict of interest</strong> &#8211; <em>as defined in sections 114C(3) and (4) Unit Titles Act 2010</em></th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;"><strong>Date</strong> financial conflict of interest disclosed by the Committee member to the Committee</th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;">Has there been a breach of <em>section 114C</em> (disclosure of the conflict), or <em>section 114D</em> (voting on the matter) <em>Unit Titles Act 2010</em>?<br/><strong>YES or NO</strong></th>
      <th style="border: 1px solid #000; padding: 5pt; text-align: left; vertical-align: top;"><strong>If YES &#8211; Date</strong> the Committee notified the breach to the Body Corporate under <em>section 114E Unit Titles Act 2010</em></th>
    </tr>
  </thead>
  <tbody>
    {{CONFLICT_REGISTER_ROWS}}
  </tbody>
</table>`;

export const DEFAULT_TEMPLATES: DocumentTemplates = {
  noiLetter:       NOI_LETTER_BC,
  responseForm:    RESPONSE_FORM_BC,
  noiLetterBC:     NOI_LETTER_BC,
  responseFormBC:  RESPONSE_FORM_BC,
  noiLetterISOC:   NOI_LETTER_ISOC,
  responseFormISOC: RESPONSE_FORM_ISOC,
  s146: S146,
  s147: S147,
  cpl:  CPL
};

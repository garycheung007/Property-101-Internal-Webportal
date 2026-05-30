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

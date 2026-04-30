

# **Model Risk Management Program**

Effective Date: 

# **Table of Contents**

[**INTRODUCTION	3**](#introduction)

[**SCOPE	3**](#scope)

[**PURPOSE	3**](#purpose)

[**DEFINITIONS AND PRINCIPLES	4**](#definitions-and-principles)

[**ROLES AND RESPONSIBILITIES	6**](#roles-and-responsibilities)

[Board of Directors	6](#board-of-directors)  
[Chief Risk Officer	6](#chief-risk-officer)  
[Model Risk Management (MRM) Committee	6](#model-risk-management-\(mrm\)-committee)  
[Model Risk Management (MRM) Program Administrator	6](#model-risk-management-\(mrm\)-administrator)  
[Model Owners (1st line of defense)	7](#model-owners-\(1st-line-of-defense\))  
[Risk Management and Compliance (2nd lines of defense)	7](#risk-management-and-compliance-\(2nd-lines-of-defense\))  
[Internal Audit (3rd line of defense)	7](#internal-audit-\(3rd-line-of-defense\))

[**FRAMEWORK	8**](#framework)

[Development and Implementation	8](#development-and-implementation)  
[Use	8](#use)  
[Validation and Ongoing Monitoring (internally developed or vended models)	8](#heading)  
[Governance, Policies, and Controls	9](#governance,-policies,-and-controls)  
[Documentation	9](#documentation)

[**MODEL RISK ASSESSMENT	9**](#model-risk-assessment)

[**MODEL MANAGEMENT	10**](#model-management)

[Documentation Requirements	10](#documentation-requirements)  
[Development	10](#development)  
[Validation	11](#validation)  
[Approval	11](#roles-and-responsibilities-identify-parties-tasked-with-monitoring-tests.where-an-external-firm-or-resource-performs-model-validation,-a-fully-executed-statement-of-work-between-the-bank-and-the-firm-or-resource-will-be-required-in-order-to-clearly-specify-activities-to-be-conducted-and-the-manner-and-methodology-in-which-they-are-to-be-conducted.-this-scope-of-work-will-be-verified-and-monitored-by-the-mrm-administrator.-in-the-event-the-external-firm-or-resource-is-not-performing-to-acceptable-standards,-or-they-are-no-longer-available-to-perform-their-duties,-the-mrm-administrator-will-ensure-that-a-contingency-firm-or-resource-is-ready-and-available-to-complete-the-task\(s\).-the-contingency-firm-or-resource-will-also-be-governed-by-an-appropriate-statement-of-work.)  
[Inventory	11](#inventory)

[**EXCEPTIONS	12**](#exceptions)

# 

# **INTRODUCTION** {#introduction}

The BANK and its subsidiaries (collectively, the “Company”) rely upon the use of models, both internally developed for a specific purpose and those that are purchased from outside vendors and consultants, to carry out a number of financial, operational, and risk management functions.  The models used throughout the Company range in complexity and significance.  The use of models invariably presents risk.  Model risk can lead to financial loss, poor business and strategic decision making, or damage to the Company’s reputation.  This program document establishes a framework to assist in the active management of model risks so that potential adverse impacts of model use are addressed and minimized.  This program document supports and accomplishes the Model Risk Management Policy, which has been approved by the Board of Directors.

# **SCOPE** {#scope}

Given this is a program for corporate-level application, this program directly applies to all existing and future entities of the Company.  This program is documented, facilitated, and managed pursuant to the Board of Governors of the Federal Reserve System’s comprehensive Supervisory Guidance on Model Risk Management (MRM) for banks that utilize models.  This MRM Program addresses all salient guidance and directives specified in the Federal Reserve Board (FRB) SR Letter 11-7 (Supervisory Guidance on Model Risk Management). MRM Program guidance and directives are commensurate with the Company’s potential model risk exposures as defined by its business model and associated activities, the complexity of models used, and the critical nature of decisions made based on model outcomes.  Model governance is also developed in accord with SR 11-7 to minimize the risks associated with relying on models to make or inform decisions at the Company.

In addition to SR 11-7 mandates, this MRM Program also generally conforms with model risk assessment guidance presented in the FRB SR Letter 12-7 (Guidance on Stress Testing for Banking Organizations with Total Consolidated Assets of More Than $10 Billion).  Requirements under Letter SR 12-7 not only apply to models used in the Company’s Dodd-Frank Act Stress Tests (DFAST) capital stress testing, but all relevant elements are applied to all models.

# **PURPOSE** {#purpose}

This document outlines the Company’s program regarding the selective use of quantitative analysis and models for purposes of business and financial decision-making, managing operational, financial, and compliance risks, as well as the controls established to manage the risks associated with model use.  However, these models also pose risk to the Company.  Risks include potential adverse consequences, including financial loss, poor business and strategic decision-making, or damage to the Company’s reputation, as a result of relying on models that are incorrect or misused.  This program creates a framework to assist in the active management of model risk, so that potential adverse consequences are addressed and minimized.

Models and analytical tools covered by this program may include spreadsheets developed internally by Company personnel or systems acquired from third party vendors.  Models may be embedded in larger information systems that manage the flow of data from various sources into the model and handle the aggregation and reporting of model outcomes.

This MRM Program provides guidance to management ensuring:

* Effective management of risks associated with the development, acquisition, implementation and use of analytical tools, systems and models by the Company  
* The establishment of appropriate and effective governance and control mechanisms, including policies, procedures, controls and Board of Directors and Senior Management oversight

Details of MRM practices may vary from business unit to business unit, and as it relates to their specific models.  However, those practices will conform to the elements outlined in this Program.  It will be the responsibility of the model owner to ensure that those practices conform to the Program and that each is commensurate with the related risk exposure and the extent and complexity of each model's use.  The Chief Risk Officer and Executive Management will oversee the Model Risk Management Program to assess compliance through regular reports. Specific roles and responsibilities for Company personnel and committees related to managing model risk are outlined the Roles and Responsibilities section below.

# **DEFINITIONS AND PRINCIPLES** {#definitions-and-principles}

A “model” is defined as a quantitative method, system, or approach that applies statistical analyses, theoretic constructs, inputs, and/or assumptions to process data into quantitative estimates of expected future outcomes.  It is a financial tool that calculates results based on a series of logical steps.  The definition of a model also includes quantitative approaches whose inputs are partially or wholly qualitative or based on expert judgment, provided that the output is quantitative in nature.

Conversely, the Company does not substantiate the following to be considered models:

* Any simple data aggregation; sums, averages, standard deviations, financial ratios, etc.  
* Consistent annual growth projections, based on a single historic year-on-year change, without any other analysis being conducted  
* Decision-making mechanisms based solely on the value of a variable; for instance, a simple acceptance or rejection rule, based on the LTV value

Model risk refers to the unintended outcomes that may arise from flaws in a model’s design, development, implementation or use. The business consequences can be severe: in addition to material financial loss, misstatement of regulatory reporting and poor decision making, model risk can cause serious damage a firm’s reputation. Many of these unintended outcomes are inherent to the modeling process, such as:

* Uncertainty or flaws in the initial model assumptions  
* Uncertainty or flaws in the original data (i.e., its availability, its stability, its accuracy)  
* Uncertainty or flaws in a model’s design  
* Flaws in the development of the model (including the suitability of the chosen techniques and the limitations of the techniques)  
* Uncertainty or flaws in the model application or deployment stage  
* Inherent uncertainty arising from the stochastic nature of certain modeling techniques

A model normally consists of three distinct operational elements:

* **Information input component**: Delivers assumptions and data to the model  
  * This element can and generally will consist of a hypothesis, assumptions, data sources and availability, scenarios, compliance and regulatory requirements, and validation approaches.  
* **Processing component**: Transforms inputs and assumptions into estimates   
  * This element can and generally will consist of validation processes, conceptual soundness concept theories, an implementation plan, back-testing procedures, data quality; and an approach to aggregating processing results  
* **Reporting component**: Translates outcomes into useful business information  
  * This element can and generally will consist of the reporting of results, usage of models, ongoing monitoring processes, the use of effective challenge, and various performance results.  Output reports should be clear and comprehensible to account for the different backgrounds of model developers and users.

The use of models invariably presents model risk, which is the potential for adverse consequences created by decisions made based on incorrect or misused model outputs.  Model risk tends to exist in any model used for financial decision making or compliance.  There are two primary reasons why model risk occurs:

1. The model may have fundamental errors and may produce inaccurate outputs when viewed against the design objective and intended business uses.

   1. The mathematical calculation and quantification exercise underlying any model generally involves application of theory, choice of sample design and numerical routines, selection of inputs and estimation, and implementation in information systems. Errors can occur at any point from design through implementation.

   2. In addition, shortcuts, simplifications, or approximations used to manage complicated problems could compromise the integrity and reliability of outputs from those calculations.

   3. Finally, the quality of model outputs depends on the quality of input data and assumptions, and errors in inputs or incorrect assumptions will lead to inaccurate outputs.

2. The model may be used incorrectly or inappropriately.

   1.  Even a fundamentally sound model producing accurate outputs consistent with the design objective of the model may exhibit high model risk if it is misapplied or misused. Models by their nature are simplifications of reality, and real-world events may prove those simplifications inappropriate. This is even more of a concern if a model is used outside the environment for which it was designed. Banks may do this intentionally as they apply existing models to new products or markets, or inadvertently as market conditions or customer behavior changes.

   2. Decision makers need to understand the limitations of a model to avoid using it in ways that are not consistent with the original intent. Limitations come in part from weaknesses in the model due to its various shortcomings, approximations, and uncertainties. Limitations are also a consequence of assumptions underlying a model that may restrict the scope to a limited set of specific circumstances and situations.

This MRM Program provides the guidance necessary to manage model risk at the Company and ensure compliance with the following principles:

* The organization manages model risk through effective model lifecycle management  
* All models are subject to an appropriate level of governance based on the level of inherent risk associated with their use  
* All models are subject to model vetting and validation procedures performed by individuals who have the requisite knowledge and skill and are independent from the development and ownership of the model

# **ROLES AND RESPONSIBILITIES** {#roles-and-responsibilities}

## Board of Directors {#board-of-directors}

Model risk governance is provided at the highest level by the board of directors when they authorize a Company-wide approach to model risk management. As part of their overall responsibilities, the Company's Board confers a strong model risk management framework that fits into the Enterprise Risk Management Program.  The framework will be grounded in an understanding of model risk—not just for individual models but also in the aggregate. The framework includes standards for model development, implementation, use, and validation. While the Board is ultimately responsible, it has delegated to senior management the responsibility for designing, executing, implementing, and maintaining an effective model risk management framework.  In the same manner as for other major areas of risk, senior management, directly and through relevant committees, is responsible for regularly reporting to the Board on significant model risk, from individual models and in the aggregate, and on compliance with policy.  Board members will validate that the level of model risk is within the acceptable tolerance levels within the Company and will direct changes where appropriate.  These actions set the tone for the whole organization about the importance of model risk and the need for active model risk management.

## Chief Risk Officer {#chief-risk-officer}

Model risk governance is overseen by the Chief Risk Officer (CRO) through the Company-wide approach to model risk management.  As part of the overall responsibilities, the CRO sponsored the development of a strong model risk management framework that fits into the Enterprise Risk Management Program of the Company.  This framework is grounded in an understanding of model risk—not just for individual models but also in the aggregate.  The framework includes standards for model development, implementation, use, and validation.  The board is ultimately responsible for model risk management, but has delegated the responsibility for designing, executing, implementing, and maintaining the model risk management framework to the CRO and the Risk Roundtable.  In the same manner as for other major areas of risk, senior management, directly and through relevant committees, is responsible for regularly reporting to the Board on significant model risk, from individual models and in the aggregate, and on compliance with policy.  The CRO will ensure that the level of model risk is within the acceptable tolerance levels within the Company and will direct changes where appropriate.  These actions also set the tone for the whole organization about the importance of model risk and the need for active model risk management.  The CRO will be responsible to assign competent staff, oversee model development and implementation, evaluate model results, ensure effective challenge, review validation and internal audit findings, and take prompt remedial action, when necessary.

## Model Risk Management (MRM) Committee {#model-risk-management-(mrm)-committee}

This is the senior management committee with responsibility for overseeing the model governance program. The committee reports on risk issues and trends to the risk committee of the board, or takes other action as appropriate.  *See the MRM Committee Guidelines for additional information.*

## Model Risk Management (MRM) Administrator {#model-risk-management-(mrm)-administrator}

The MRM Administrator is responsible for assisting the model owners with certain governance responsibilities.  The MRM Administrator is responsible for maintaining adequate policies, procedures, and a model inventory, as well as ensuring compliance, overseeing model development and implementation, facilitating the evaluating model results, ensuring effective challenge, reviewing validation and internal audit findings, and taking prompt remedial action when necessary.  In the same manner as for other major areas of risk, the MRM Administrator, directly and through the MRM Committee, is responsible for regularly reporting to the board on significant model risk, from individual models and in the aggregate, and on compliance with policy.  The MRM Administrator is also responsible for ensuring that a periodic review – at least annually but more frequently if warranted – of each model is performed to determine whether it is working as intended and if existing validation activities are sufficient.

## Model Owners (1st line of defense) {#model-owners-(1st-line-of-defense)}

Model Owners are generally responsible for the model risk associated with their business strategies.  The role of model owner involves ultimate accountability for model use and performance within the framework set by Company policies and procedures.  Model owners should be responsible for ensuring that models are properly developed, implemented, and used.  The model owner should also ensure that models in use have undergone appropriate validation and approval processes, promptly identify new or changed models, and provide all necessary information for validation activities.

## Risk Management and Compliance (2nd lines of defense) {#risk-management-and-compliance-(2nd-lines-of-defense)}

Across the model lifespan, it is critical to answer questions such as: “Are these models still fit for purpose?” or “What corrective actions are needed in case of model performance breaches?”  This is where the second line of defense comes in.  For an integrated model risk management system to work, the second line must execute beyond periodic validation to ensure that model use and performance remain in alignment with the risk profile, so that business and regulatory objectives are met.

Independent validation is crucial, of course.  The Company must drive consistency in validation testing methodologies and in selecting appropriate data sets, so that results aren’t skewed.  In addition to back-testing for performance, the Company will leverage effective challenge testing of competing models and/or decision strategies on random samples from production populations. Validation documentation is critical, and must be made readily accessible to internal stakeholders and regulators.

Beyond validations, a cycle of model performance monitoring must occur.  This monitoring confirms that each model has been correctly implemented, and that it is being used and is performing as intended.

Model validation and ongoing monitoring will help the Company mitigate model risk, including temporary and permanent remediation.  It is important to implement a mix of short- and long-term remediation planning.  While this may not address all issues related to model use and performance, it will help provide the appropriate processes, controls and technologies to determine and address the root causes of model degradation.

## Internal Audit (3rd line of defense) {#internal-audit-(3rd-line-of-defense)}

The Company's Internal Audit function will assess the overall effectiveness of the model risk management framework, including the framework's ability to address both types of model risk; a) fundamental errors in models, and b) incorrect or inappropriate use of models, for individual models and in the aggregate.  Findings from Internal Audit related to models will be documented and reported to the Board’s Audit Committee and Enterprise Risk Committee.  The Director of Internal Audit will ensure that the audit team has appropriate skills, and has adequate stature in the organization to assist in model risk management.  Internal Audit's role is to evaluate whether model risk management is comprehensive, rigorous, and effective.  If some Internal Audit staff perform certain model validation activities, then they should not be involved in the assessment of the overall model risk management framework.  Internal Audit will verify records of model use and validation to test whether validations are performed in a timely manner and whether models are subject to controls that appropriately account for any weaknesses in validation activities.  Accuracy and completeness of the model inventory should be assessed.  In addition, processes for establishing and monitoring limits on model usage will be evaluated.  Internal Audit will determine whether procedures for updating models are clearly documented, and test whether those procedures are being carried out as specified.  Internal Audit will also check that model owners and control groups are meeting documentation standards, including risk reporting.  Additionally, Internal Audit will perform assessments of supporting operational systems and evaluate the reliability of data used by models.  Internal Audit also has an important role in ensuring that validation work is conducted properly and that appropriate effective challenge is being carried out.  It must evaluate the objectivity, competence, and organizational standing of the key validation participants, with the ultimate goal of ascertaining whether those participants have the right incentives to discover and report deficiencies.  Internal audit will review validation activities conducted by internal and external parties with the same rigor to see if those activities are being conducted in accordance with this guidance.

# **FRAMEWORK** {#framework}

The framework for the Model Risk Management Program is set forth to clearly define the requirements for maintaining an effective MRM program. The key areas covered in the following section, as defined by the Supervisory Guidance on Model Risk Management (SR 11-7), are as follows:

## Development and Implementation {#development-and-implementation}

* A clear definition of a model’s purpose (statement of purpose) must be provided   
* Data and other information should be appropriate, should undergo rigorous quality testing, as well as checks to ensure its use is justified, and any approximations should be thoroughly documented   
* Testing procedures must be documented to assess the accuracy, robustness, stability, and limitations of the model, as well as a behavior test for different input values   
* A standard definition for what would be considered acceptable “conservative” limits must be well documented for each model   
* The entire development process must be documented in detail   
* All components of a model must be reviewed during the development process, including for conceptual soundness, mathematical and statistical correctness, as well as comparisons to alternative theories/approaches 

## Use {#use}

* User feedback provides an opportunity to check model performance   
* Reports must be provided using estimations and model output values for different sets of inputs, in order to provide indicators of model precision, robustness, and stability   
* Prudent use of models must include suitably defensible conservative approaches, stress tests, and/or possible capital buffers for model risk 

## Validation and Ongoing Monitoring (internally developed or vended models)

* Evaluation of Conceptual Soundness   
  * Assess the quality of model design and construction  
  * Review documentation and evidence supporting methods and variables used  
  * Ensure any judgment used is well informed, carefully considered, and consistent with industry standards  
* Validation   
  * Validators must have knowledge and expertise and be familiar with the lines of business in which the model is used  
  * The Program Administrator will maintain a proper model validation schedule  
  * Validation must apply to all models, whether developed in-house or by third parties  
  * Validation must apply to all model components  
  * Validation must be commensurate with model use, complexity, and materiality  
  * Validation must require independence between model developers and users  
  * Staff conducting validation efforts should have explicit authority to challenge developers and users and to elevate their findings, including issues and deficiencies  
  * The extent of validation activities prior to models being placed into production is directly related to the model’s risk level, complexity, and whether it is an internally-developed or a vended model  
* Ongoing Monitoring   
  * Confirm model is properly implemented and used/performing as intended  
  * Benchmark to compare model input and output to estimates  
  * Document an overall plan for monitoring each model – test plan, results falling within and outside of expected ranges, and action plan including risk acceptance process  
* Outcome Analysis   
  * Compare model outputs to actual outcomes (i.e., back-testing)  
  * Compare output with expected outputs – including accuracy, completeness, appropriate indicators of performance and limitations, as well as being specifically informative  
* Effective challenge of models may come directly from the 3 Lines of Defense structure, but suggestions and criticism may come from sources fully independent of the MRM structure   
* Internal validation activities may be conducted by internal resources that have experience with validating models; otherwise, model validation activities will be conducted by external resources that have been vetted through the Bank’s Vendor Management Program, as well as the MRM Administrator and Internal Audit   
* Internal Audit must verify the effectiveness of this framework   
* Validation cadence will be required and scheduled based upon the appropriate model’s risk level:   
  * High risk models will be validated every 12-18 months  
  * Medium risk models will be validated every 18-24 months  
  * Low risk models will be validated every36 months

## Governance, Policies, and Controls {#governance,-policies,-and-controls}

* The MRM Policy is approved by the Board of Directors, which should be regularly informed about any significant model risks   
* The three basic roles within this MRM framework are:   
  * Ownership (use of models)  
  * Control (model risk measurement, limit setting and monitoring)  
  * Compliance (by the other two roles)  
* The Company must maintain a full inventory of all models in use   
* Where appropriate and/or necessary, utilize external resources to perform validation and compliance tasks   
* All models must be reviewed at least annually and whenever they undergo material changes 

## Documentation {#documentation}

* Each model must be documented with a level of detail that would permit a third-party to understand the operation, limitations, and key assumptions of the each model   
* Regarding third-party models (vendor models), adequate documentation must be provided so that the model can be properly validated 

# **MODEL RISK ASSESSMENT** {#model-risk-assessment}

Materiality of decisions made based on model outcomes, computational complexity, and audiences are key considerations in creating risk weightings (prioritizations) relating to the MRM Program design.  Materiality is assessed in both qualitative and quantitative terms as follows, and the assessment is used to inform the scope and comprehensiveness of model documentation, vetting, review, validation, and monitoring.

Model risk ratings are determined based on a management approved scoring methodology unless otherwise decided by the Program Administrator.

# **MODEL MANAGEMENT** {#model-management}

## Documentation Requirements {#documentation-requirements}

Without adequate documentation, the Company’s model risk management program will be ineffective.  Documentation of model development and validation will be sufficiently detailed so that parties unfamiliar with a model can understand how the model operates, its limitations, and its key assumptions.  Documentation will provide for continuity of operations, make compliance with policy transparent, and help track recommendations, responses, and exceptions.

The Company will benefit from advances in information and knowledge management systems and electronic documentation to improve timeliness and accessibility of the various records and reports produced in the model risk management process.  

Documentation takes time and effort, and developers and users who know the models well may not appreciate the value.  Model developers have responsibility during model development for thorough documentation, which should be kept up-to-date as the model and application environment changes.  In addition, the Company will ensure that other participants in model risk management activities document their work, including ongoing monitoring, process verification, benchmarking, and outcomes analysis.  Also, line of business or other decision makers will document information leading to selection of a given model and its subsequent validation.  For cases in which the Company uses models from a vendor or other third party, it will ensure that appropriate documentation of the third-party approach is available so that the model can be appropriately validated.

Validation reports will articulate model aspects that were reviewed, highlighting potential deficiencies over a range of financial and economic conditions, and determining whether adjustments or other compensating controls are warranted.  Effective validation reports include clear executive summaries, with a statement of model purpose and an accessible synopsis of model and validation results, including major limitations and key assumptions.  The Program Administrator will ensure that the Director of Internal Audit receives a copy of every validation report.

## Development {#development}

The Company has minimum development standards for model development.  Each model has a clear statement of purpose.  Internal guidelines contained in the Model Risk Management Standard prescribe the extent and nature of model development testing – depending on type and materiality of model.  Controls are in place to verify the appropriate mapping of models to business applications.  A formal assessment of quality and relevance of data is used in the Company’s approach to model development.  Appropriate reviews are also conducted to identify potential compliance-related issues.  The same standard applies for any redevelopment work associated with existing models.

With regard to vended models, depending on the risk level of the model, it will be necessary to identify a contingency model, in the event there are material, uncorrectable issues with the primary model selected.

## Validation {#validation}

Systems and processes are in place to ensure data and reporting integrity, together with controls and testing to ensure proper implementation of models, effective systems integration, and appropriate use.  The Company employs testing to determine if models are performing as intended:

* Evaluating the conceptual soundness of the model  
* Checking the model's accuracy  
* Demonstrating model robustness and stability  
* Evaluating the model’s behavior over a range of input values  
* Assessing the impact of assumptions  
* Ongoing monitoring  
* Comparing the model’s output against corresponding actual outcomes

Testing is also undertaken to determine performance under various scenarios and conditions:

* Business as usual as well as non-standard or extreme testing

Testing includes not only specific models, but also the model as a component in larger systems.  Testing activities, whether internally developed or vended models, are well documented with reasonably detailed test plans and clear, understandable test results.  Testing activities commensurate with model complexity and criticality.  Company’s procedures should detail the firm’s testing activities, including minimum requirements and documentation standards, including:

* Description of testing approach utilized and supporting rationale.  
* Details of test results (pass/fail/needs improvement) and supporting evidence.  
  * Suspension or discontinuing use where significant validation findings or errors in quantitative testing are discovered  
* Inventory of specific issues identified with assigned level of urgency.  
* Required communication of test results to relevant stakeholders.  
* Standards, processes and timelines to remediate deficiencies for poor or under-performing models.

Roles and responsibilities identify parties tasked with monitoring tests.Where an external firm or resource performs model validation, a fully executed statement of work between the Bank and the firm or resource will be required in order to clearly specify activities to be conducted and the manner and methodology in which they are to be conducted.  This scope of work will be verified and monitored by the MRM Administrator.  In the event the external firm or resource is not performing to acceptable standards, or they are no longer available to perform their duties, the MRM Administrator will ensure that a contingency firm or resource is ready and available to complete the task(s).  The contingency firm or resource will also be governed by an appropriate statement of work.

## Approval

Models will be approved at multiple stages within the process by various leadership levels within the organization:

* Development  
* Validation  
* Implementation  
* Change Management  
* Retirement

## Inventory {#inventory}

Banks should maintain a comprehensive set of information for models implemented for use, under development for implementation, or recently retired. While each line of business may maintain its own inventory, the MRM Administrator charged with maintaining a firm-wide inventory of all models, which should assist a bank in evaluating its model risk in the aggregate. Any variation of a model that warrants a separate validation should be included as a separate model and cross-referenced with other variations. While the inventory may contain varying levels of information, given different model complexity and the Company's overall level of model usage, the following are some general guidelines. The inventory should describe the purpose and products for which the model is designed, actual or expected usage, and any restrictions on use. It is useful for the inventory to list the type and source of inputs used by a given model and underlying components (which may include other models), as well as model outputs and their intended use. It should also indicate whether models are functioning properly, provide a description of when they were last updated, and list any exceptions to policy. Other items include the names of individuals responsible for various aspects of the model development and validation; the dates of completed and planned validation activities; and the time frame during which the model is expected to remain valid. 

# **EXCEPTIONS** {#exceptions}

For models and model activities that have occurred after the approval of this MRM Program, an exception to this Program could occur in any of the circumstances identified below:

* Use of a model or modified model that has not been approved for use   
* Use of an inappropriate model (e.g., a model that is approved for one product or asset class is applied to a different product or asset or use of parameters that are outside of the approved quantitative guidelines);  
* Failure of validation, vetting, or other similar review for an in-use model, including failure of a model to meet predefined performance benchmarks  
* Back testing or other monitoring results suggest that the performance of the model may be inadequate

Any exception requests received in regard to this program will be addressed individually and the Company’s Chief Risk Officer will ultimately determine the result of each request.
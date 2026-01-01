http://localhost:3000/invoices/INV-001/edit 
http://localhost:3000/customers/1/edit

checklist
INVOICE (FACTOR) WEB APP – CHECKLIST
Next.js + PWA

⸻

	1.	PRODUCT SCOPE

	•	Define invoice types (sell / purchase / proforma)
	•	Single business or multi-branch
	•	Multi-currency support
	•	Tax / VAT / discount rules
	•	A4 print & PDF support
	•	Offline support (PWA)

⸻

	2.	TECH STACK

Frontend
	•	Next.js (App Router)
	•	TypeScript
	•	Tailwind CSS
	•	React Hook Form
	•	Zod validation
	•	Zustand or Redux
	•	i18n (EN / FA / AR)

Backend
	•	Next.js API Routes OR separate backend
	•	REST or GraphQL
	•	Authentication (JWT / NextAuth)

Database
	•	PostgreSQL or MySQL
	•	Prisma ORM
	•	Migrations

⸻

	3.	AUTH & ROLES

	•	Login / Register
	•	Forgot password
	•	Roles:
	•	Admin
	•	Accountant
	•	Staff
	•	Branch-level permissions

⸻

	4.	CORE MODELS

Business
	•	Name
	•	Logo
	•	Address
	•	Tax number
	•	Currency
	•	Settings

Branch
	•	Name
	•	Logo
	•	Address
	•	Phone
	•	Manager

Customer
	•	Name
	•	Phone
	•	Email
	•	Address
	•	Notes

Product / Service
	•	Name
	•	SKU
	•	Price
	•	Tax %
	•	Unit

Invoice
	•	Invoice number (auto)
	•	Branch ID
	•	Customer ID
	•	Date
	•	Due date
	•	Status (draft / paid / canceled)
	•	Subtotal
	•	Discount
	•	Tax
	•	Total

Invoice Item
	•	Product ID
	•	Quantity
	•	Unit price
	•	Line total

⸻

	5.	INVOICE FEATURES

	•	Create invoice
	•	Edit invoice
	•	Duplicate invoice
	•	Draft invoices
	•	Auto invoice numbering
	•	Branch-based logo
	•	Auto total calculation
	•	Item or global tax & discount
	•	Invoice preview

⸻

	6.	PRINT & PDF

	•	A4 layout
	•	Print CSS
	•	Company / branch logo
	•	QR code (optional)
	•	PDF export
	•	Print without browser header/footer
	•	Multi-language invoice

⸻

	7.	PWA

	•	manifest.json
	•	App icons (192 / 512)
	•	Service worker
	•	Offline cache
	•	Offline invoice view
	•	Background sync
	•	Install prompt
	•	Mobile-first UI

⸻

	8.	DASHBOARD & REPORTS

	•	Invoice list
	•	Filters (date, branch, status)
	•	Monthly revenue
	•	Tax report
	•	Customer balance
	•	Export CSV / Excel

⸻

	9.	UI / UX

	•	Fast invoice creation
	•	Mobile support
	•	Dark mode
	•	RTL support
	•	Error handling
	•	Toast notifications

⸻

	10.	SECURITY

	•	Input validation
	•	API rate limiting
	•	Role-based access
	•	Secure env variables
	•	HTTPS
	•	Audit logs

⸻

	11.	DEPLOYMENT

	•	Vercel or Docker
	•	Production database
	•	Backup strategy
	•	Error monitoring
	•	Analytics

⸻

	12.	MONETIZATION (OPTIONAL)

	•	Free plan
	•	Paid plan
	•	Invoice limit
	•	Multi-branch paid feature
	•	PDF export as paid feature

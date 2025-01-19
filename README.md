run using ```docker-compose up```
API Documentation
account.routes.js
GET /accounts
Description: Retrieves a list of accounts.
Query Parameters:

page (optional): The page number (default: 1).
limit (optional): The number of accounts per page (default: 10).
searchBy (optional): The field to search by (e.g., "name" or "_id").
search (optional): The search query.
Authentication: Requires authentication with a valid token and super admin privileges.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "accounts": [/* array of account objects */],
  "currentPage": 1,
  "totalPages": 10,
  "totalAccounts": 100
}
Status: 500 Internal Server Error
Body: Error message
POST /login
Description: Logs in to the system.
Request Body:

username: The username of the account.
password: The password of the account.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "token": "JWT token",
  "name": "User name",
  "isSuperAdmin": true
}
Status: 401 Unauthorized
Body: Invalid credentials
Status: 500 Internal Server Error
Body: Error message
PATCH /accounts/{id}
Description: Updates an account.
Path Parameters:

{id}: The ID of the account to update.
Request Body:
username (optional): The username of the account.
name (optional): The name of the account.
password (optional): The password of the account.
Authentication: Requires authentication with a valid token.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "message": "Account updated successfully",
  "account": { /* updated account object */ }
}
Status: 403 Forbidden
Body: Only super admins can update the isSuperAdmin flag of an account.
Status: 404 Not Found
Body: Account not found
Status: 500 Internal Server Error
Body: Error message
POST /accounts
Description: Creates a new account.
Request Body:

username: The username of the account.
name: The name of the account.
password: The password of the account.
Authentication: Requires authentication with a valid token and super admin privileges.
Response:

Status: 201 Created
Body:
json
Copy
Edit
{
  "message": "Account created successfully",
  "account": { /* newly created account object */ }
}
Status: 403 Forbidden
Body: Only super admins can create accounts.
Status: 400 Bad Request
Body: Error message
DELETE /accounts/{id}
Description: Deletes an account.
Path Parameters:

{id}: The ID of the account to delete.
Authentication: Requires authentication with a valid token and super admin privileges.
Response:

Status: 200 OK
Body: Account deleted successfully
Status: 500 Internal Server Error
Body: Error message
customer.routes.js
GET /customers
Description: Retrieves a list of customers.
Query Parameters:

page (optional): The page number (default: 1).
limit (optional): The number of customers per page (default: 10).
searchBy (optional): The field to search by (e.g., "name" or "_id").
search (optional): The search query.
Authentication: Requires authentication with a valid token.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "customers": [/* array of customer objects */],
  "currentPage": 1,
  "totalPages": 10,
  "totalCustomers": 100
}
Status: 500 Internal Server Error
Body: Error message
POST /customers
Description: Creates a new customer.
Request Body:

name: The name of the customer.
phone: The phone number(s) of the customer (array of strings).
residence: The residence of the customer.
sizes (optional): The sizes of the customer.
Authentication: Requires authentication with a valid token.
Response:

Status: 201 Created
Body:
json
Copy
Edit
{
  "message": "Customer created successfully",
  "customer": { /* newly created customer object */ }
}
Status: 400 Bad Request
Body: Error message
PUT /customers/{id}
Description: Updates a customer.
Path Parameters:

{id}: The ID of the customer to update.
Request Body:
name (optional): The name of the customer.
phone (optional): The phone number(s) of the customer (array of strings).
residence (optional): The residence of the customer.
sizes (optional): The sizes of the customer.
Authentication: Requires authentication with a valid token.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "customer": { /* updated customer object */ }
}
Status: 400 Bad Request
Body: Error message
DELETE /customers/{id}
Description: Deletes a customer.
Path Parameters:

{id}: The ID of the customer to delete.
Authentication: Requires authentication with a valid token.
Response:

Status: 200 OK
Body: Customer deleted successfully
Status: 500 Internal Server Error
Body: Error message
POST /customers/import
Description: Imports customers from an Excel file.
Authentication: Requires authentication with a valid token and super admin privileges.
Response:

Status: 200 OK
Body:
json
Copy
Edit
{
  "message": "Customers imported successfully",
  "imported": 50,
  "total": 100
}
Status: 400 Bad Request
Body: Error message
GET /customers/export
Description: Exports customers to an Excel file.
Authentication: Requires authentication with a valid token and super admin privileges.
Response:

Status: 200 OK
Body: Excel file containing customer data.
Status: 500 Internal Server Error
Body: Error message

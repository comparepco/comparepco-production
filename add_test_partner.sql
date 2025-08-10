-- Add test partner to the database
INSERT INTO partners (
  id,
  company_name,
  email,
  phone,
  status,
  business_type,
  address,
  documents,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Test Transport Company',
  'test@transportcompany.com',
  '+44 123 456 7890',
  'pending_review',
  'transport_company',
  '123 Test Street, London, SW1A 1AA, UK',
  '{
    "business_license": {
      "status": "pending_review",
      "url": "https://example.com/business-license.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z"
    },
    "insurance_certificate": {
      "status": "approved",
      "url": "https://example.com/insurance.pdf",
      "uploaded_at": "2024-01-10T14:20:00Z",
      "reviewed_at": "2024-01-12T09:15:00Z",
      "reviewed_by": "Admin"
    },
    "operator_license": {
      "status": "pending_review",
      "url": "https://example.com/operator-license.pdf",
      "uploaded_at": "2024-01-14T16:45:00Z"
    },
    "tax_certificate": {
      "status": "rejected",
      "url": "https://example.com/tax-cert.pdf",
      "uploaded_at": "2024-01-08T11:00:00Z",
      "rejection_reason": "Document quality insufficient - please provide clearer copy"
    }
  }',
  NOW() - INTERVAL '5 days',
  NOW()
); 
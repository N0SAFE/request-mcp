# Schema Form Documentation

The SchemaForm component is a powerful and flexible form builder that accepts a JSON Schema to define form structure, validation rules, and appearance. This documentation explains how to create forms using the schema format.

## Key Features

- **Rich Input Types**: Support for over 15 different input types
- **Nested Forms**: Create complex form structures with nested objects
- **Validation**: Built-in validation rules with pattern matching
- **Dynamic Select**: Dropdown menus with custom labels
- **Conditional Fields**: Show/hide fields based on conditions
- **Custom Styling**: Apply custom styles and classes
- **Accessibility**: Built with accessibility in mind

## Basic Structure

A schema should be a JSON object with the following basic structure:

```json
{
  "type": "object",
  "title": "Form Title",
  "description": "Optional form description",
  "properties": {
    "fieldName": {
      "type": "string",
      "title": "Field Label",
      "description": "Optional field description"
    }
  },
  "required": ["fieldName"]
}
```

## Input Types Reference

### Basic Input Types

#### Text Input (`type: "string"`)
```json
{
  "type": "string",
  "title": "Username",
  "description": "Enter your username",
  "placeholder": "john.doe",
  "pattern": "^[a-zA-Z0-9_]{3,16}$"
}
```

#### Email Input (`format: "email"`)
```json
{
  "type": "string",
  "format": "email",
  "title": "Email Address",
  "description": "Your primary email address",
  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
}
```

#### Password Input (`format: "password"`)
```json
{
  "type": "string",
  "format": "password",
  "title": "Password",
  "description": "Must contain at least 8 characters",
  "pattern": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"
}
```

### Rich Text Inputs

#### Textarea (`format: "textarea"`)
```json
{
  "type": "string",
  "format": "textarea",
  "title": "Bio",
  "description": "Tell us about yourself",
  "options": {
    "multiline": true
  }
}
```

#### Pattern Input (`format: "pattern"`)
```json
{
  "type": "string",
  "format": "pattern",
  "title": "Credit Card",
  "pattern": "^\\d{4}-\\d{4}-\\d{4}-\\d{4}$",
  "placeholder": "1234-5678-9012-3456"
}
```

### Numeric Inputs

#### Number Input (`type: "number"`)
```json
{
  "type": "number",
  "title": "Age",
  "minimum": 0,
  "maximum": 150,
  "description": "Your age in years"
}
```

#### Currency Input (`format: "currency"`)
```json
{
  "type": "number",
  "format": "currency",
  "title": "Price",
  "minimum": 0,
  "maximum": 1000000,
  "options": {
    "currency": "€"
  }
}
```

#### Range Slider (`format: "range"`)
```json
{
  "type": "number",
  "format": "range",
  "title": "Volume",
  "minimum": 0,
  "maximum": 100,
  "description": "Adjust the volume level"
}
```

### Selection Inputs

#### Select Dropdown (enum)
```json
{
  "type": "string",
  "title": "Country",
  "enum": ["us", "uk", "fr", "de"],
  "enumNames": ["United States", "United Kingdom", "France", "Germany"]
}
```

#### Rating Input (`format: "rating"`)
```json
{
  "type": "number",
  "format": "rating",
  "title": "Rating",
  "description": "Rate your experience",
  "options": {
    "maxRating": 5
  }
}
```

### Special Inputs

#### Color Picker (`format: "color"`)
```json
{
  "type": "string",
  "format": "color",
  "title": "Theme Color",
  "description": "Pick a color for your theme"
}
```

#### Phone Input (`format: "phone"`)
```json
{
  "type": "string",
  "format": "phone",
  "title": "Phone Number",
  "options": {
    "countryCode": "FR"
  }
}
```

#### Tags Input (`format: "tags"`)
```json
{
  "type": "array",
  "format": "tags",
  "title": "Skills",
  "description": "Enter your skills (press Enter after each)",
  "placeholder": "Type a skill..."
}
```

#### Date Fields
```json
{
  "type": "string",
  "format": "date",
  "title": "Start Date",
  "description": "Select when you want to start",
  "placeholder": "Choose start date..."
}
```

The date field will render as a calendar picker with the following features:
- Clean and modern calendar interface
- Date formatting using date-fns
- Keyboard navigation support
- Accessible ARIA labels
- Clear date selection option
- Mobile-friendly design

Example usage in a form:
```json
{
  "type": "object",
  "title": "Event Details",
  "properties": {
    "eventName": {
      "type": "string",
      "title": "Event Name"
    },
    "startDate": {
      "type": "string",
      "format": "date",
      "title": "Start Date",
      "placeholder": "Select event start date"
    },
    "endDate": {
      "type": "string",
      "format": "date",
      "title": "End Date",
      "placeholder": "Select event end date"
    }
  },
  "required": ["eventName", "startDate"]
}
```

Supported formats:
- `email` - Email input field
- `uri` - URL input field
- `date` - Date picker
- `time` - Time picker
- `datetime` - DateTime picker
- `password` - Password input field
- `textarea` - Multiline text input

### Number Fields
```json
{
  "type": "number",  // or "integer"
  "title": "Age",
  "description": "Your age in years",
  "minimum": 0,
  "maximum": 150
}
```

### Boolean Fields
```json
{
  "type": "boolean",
  "title": "Subscribe to newsletter",
  "description": "Receive updates via email"
}
```

### Select Fields (Enum)
```json
{
  "type": "string",
  "title": "Country",
  "enum": ["us", "uk", "fr"],
  "enumNames": ["United States", "United Kingdom", "France"]
}
```

### Object Fields (Nested Forms)
```json
{
  "type": "object",
  "title": "Address",
  "properties": {
    "street": {
      "type": "string",
      "title": "Street"
    },
    "city": {
      "type": "string",
      "title": "City"
    },
    "country": {
      "type": "string",
      "title": "Country"
    }
  },
  "required": ["street", "city"]
}
```

## Layout Options

The SchemaForm supports various layout options to customize how form fields are displayed. Layout options can be specified in the `options.layout` property of any object type schema.

### Available Layout Types

1. **Default Layout**
```json
{
  "type": "object",
  "properties": {
    "field1": { ... },
    "field2": { ... }
  }
}
```

2. **Flex Layout**
```json
{
  "type": "object",
  "options": {
    "layout": {
      "type": "flex",
      "gap": "medium",
      "alignment": "center"
    }
  },
  "properties": {
    "firstName": {
      "type": "string",
      "title": "First Name"
    },
    "lastName": {
      "type": "string",
      "title": "Last Name"
    }
  }
}
```

3. **Grid Layout**
```json
{
  "type": "object",
  "options": {
    "layout": {
      "type": "grid",
      "columns": 2,
      "gap": "large"
    }
  },
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string",
      "format": "phone"
    }
  }
}
```

4. **Columns Layout**
```json
{
  "type": "object",
  "options": {
    "layout": {
      "type": "columns",
      "columns": 3
    }
  },
  "properties": {
    // ... fields will be arranged in newspaper-style columns
  }
}
```

### Layout Options Reference

```typescript
interface LayoutOptions {
  type?: 'default' | 'flex' | 'grid' | 'columns' | 'tabs'
  columns?: 1 | 2 | 3 | 4
  gap?: 'small' | 'medium' | 'large'
  alignment?: 'start' | 'center' | 'end'
  style?: {
    className?: string
    padding?: string
    margin?: string
    background?: string
  }
}
```

### Complex Example with Layouts

```json
{
  "type": "object",
  "title": "User Profile",
  "options": {
    "layout": {
      "type": "grid",
      "columns": 2,
      "gap": "large",
      "style": {
        "padding": "p-6",
        "background": "gray-50",
        "className": "rounded-lg shadow-sm"
      }
    }
  },
  "properties": {
    "personalInfo": {
      "type": "object",
      "title": "Personal Information",
      "options": {
        "layout": {
          "type": "flex",
          "gap": "medium",
          "alignment": "center"
        }
      },
      "properties": {
        "firstName": {
          "type": "string",
          "title": "First Name"
        },
        "lastName": {
          "type": "string",
          "title": "Last Name"
        },
        "avatar": {
          "type": "string",
          "format": "file",
          "title": "Profile Picture"
        }
      }
    },
    "contactInfo": {
      "type": "object",
      "title": "Contact Information",
      "options": {
        "layout": {
          "type": "grid",
          "columns": 2,
          "gap": "small"
        }
      },
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email Address"
        },
        "phone": {
          "type": "string",
          "format": "phone",
          "title": "Phone Number"
        },
        "address": {
          "type": "string",
          "format": "textarea",
          "title": "Address"
        }
      }
    },
    "preferences": {
      "type": "object",
      "title": "Preferences",
      "options": {
        "layout": {
          "type": "columns",
          "columns": 3
        }
      },
      "properties": {
        "theme": {
          "type": "string",
          "title": "Theme",
          "enum": ["light", "dark", "system"],
          "enumNames": ["Light Mode", "Dark Mode", "System Default"]
        },
        "notifications": {
          "type": "boolean",
          "title": "Enable Notifications"
        },
        "newsletter": {
          "type": "boolean",
          "title": "Subscribe to Newsletter"
        }
      }
    }
  }
}
```

This example demonstrates:
- Grid layout for the main form
- Flex layout for personal information section
- Grid layout for contact information
- Column layout for preferences
- Custom styling with padding and background
- Proper spacing and alignment
- Responsive design considerations

### Layout Best Practices

1. **Responsive Design**
   - Use flex layout for naturally responsive sections
   - Grid layout automatically adjusts on smaller screens
   - Consider mobile users when choosing column counts

2. **Spacing**
   - Use consistent gap sizes throughout your form
   - Apply appropriate padding for nested sections
   - Use margins to separate major form sections

3. **Alignment**
   - Use center alignment for important or focused content
   - Keep related fields aligned together
   - Maintain consistent alignment within sections

4. **Styling**
   - Use background colors to distinguish sections
   - Apply rounded corners and shadows for depth
   - Keep the styling consistent with your application theme

## Complete Example

Here's a complete example that demonstrates various field types and features:

```json
{
  "type": "object",
  "title": "User Registration",
  "description": "Please fill out all required fields",
  "properties": {
    "personal": {
      "type": "object",
      "title": "Personal Information",
      "properties": {
        "firstName": {
          "type": "string",
          "title": "First Name",
          "placeholder": "John"
        },
        "lastName": {
          "type": "string",
          "title": "Last Name",
          "placeholder": "Doe"
        },
        "email": {
          "type": "string",
          "title": "Email Address",
          "format": "email",
          "placeholder": "john.doe@example.com"
        },
        "age": {
          "type": "integer",
          "title": "Age",
          "minimum": 18,
          "maximum": 150
        }
      },
      "required": ["firstName", "lastName", "email"]
    },
    "preferences": {
      "type": "object",
      "title": "Preferences",
      "properties": {
        "theme": {
          "type": "string",
          "title": "Theme",
          "enum": ["light", "dark", "system"],
          "enumNames": ["Light Mode", "Dark Mode", "System Default"]
        },
        "bio": {
          "type": "string",
          "title": "Biography",
          "format": "textarea",
          "placeholder": "Tell us about yourself..."
        },
        "notifications": {
          "type": "boolean",
          "title": "Enable Notifications",
          "description": "Receive important updates"
        }
      }
    }
  }
}
```

## Complex Example: Job Application Form

Here's a comprehensive example that demonstrates most of the available features:

```json
{
  "type": "object",
  "title": "Job Application Form",
  "description": "Please fill out all required fields marked with *",
  "properties": {
    "personalInfo": {
      "type": "object",
      "title": "Personal Information",
      "properties": {
        "firstName": {
          "type": "string",
          "title": "First Name",
          "pattern": "^[A-Za-z\\s]{2,50}$",
          "description": "Your legal first name"
        },
        "lastName": {
          "type": "string",
          "title": "Last Name",
          "pattern": "^[A-Za-z\\s]{2,50}$",
          "description": "Your legal last name"
        },
        "email": {
          "type": "string",
          "format": "email",
          "title": "Email Address",
          "description": "We'll use this to contact you"
        },
        "phone": {
          "type": "string",
          "format": "phone",
          "title": "Phone Number",
          "options": {
            "countryCode": "US"
          }
        },
        "profilePicture": {
          "type": "string",
          "format": "file",
          "title": "Profile Picture",
          "description": "Upload a professional photo",
          "options": {
            "accept": "image/*",
            "maxSize": 5242880
          }
        }
      },
      "required": ["firstName", "lastName", "email", "phone"]
    },
    "professionalInfo": {
      "type": "object",
      "title": "Professional Information",
      "properties": {
        "currentPosition": {
          "type": "string",
          "title": "Current Position",
          "placeholder": "e.g., Senior Software Engineer"
        },
        "yearsOfExperience": {
          "type": "number",
          "title": "Years of Experience",
          "minimum": 0,
          "maximum": 50
        },
        "expectedSalary": {
          "type": "number",
          "format": "currency",
          "title": "Expected Annual Salary",
          "minimum": 0,
          "options": {
            "currency": "$"
          }
        },
        "skills": {
          "type": "array",
          "format": "tags",
          "title": "Skills",
          "description": "Enter your technical skills",
          "placeholder": "Type a skill and press Enter"
        },
        "proficiencyLevel": {
          "type": "string",
          "title": "Proficiency Level",
          "enum": ["junior", "intermediate", "senior", "expert"],
          "enumNames": ["Junior", "Intermediate", "Senior", "Expert"]
        }
      },
      "required": ["currentPosition", "yearsOfExperience", "skills", "proficiencyLevel"]
    },
    "preferences": {
      "type": "object",
      "title": "Job Preferences",
      "properties": {
        "workLocation": {
          "type": "string",
          "title": "Preferred Work Location",
          "enum": ["onsite", "remote", "hybrid"],
          "enumNames": ["On-site", "Remote", "Hybrid"]
        },
        "availableFrom": {
          "type": "string",
          "format": "date",
          "title": "Available From",
          "description": "When can you start?"
        },
        "willingToRelocate": {
          "type": "boolean",
          "title": "Willing to Relocate?",
          "description": "Are you open to relocating for this position?"
        },
        "preferredHours": {
          "type": "number",
          "format": "range",
          "title": "Preferred Weekly Hours",
          "minimum": 20,
          "maximum": 40,
          "description": "Slide to select your preferred hours per week"
        }
      }
    },
    "expertise": {
      "type": "object",
      "title": "Areas of Expertise",
      "properties": {
        "primarySkill": {
          "type": "object",
          "title": "Primary Technical Skill",
          "properties": {
            "name": {
              "type": "string",
              "title": "Skill Name",
              "placeholder": "e.g., React, Python, AWS"
            },
            "experienceYears": {
              "type": "number",
              "title": "Years of Experience",
              "minimum": 0,
              "maximum": 20
            },
            "selfRating": {
              "type": "number",
              "format": "rating",
              "title": "Self Assessment",
              "description": "Rate your expertise level",
              "options": {
                "maxRating": 5
              }
            }
          },
          "required": ["name", "experienceYears", "selfRating"]
        },
        "codeExample": {
          "type": "string",
          "format": "code",
          "title": "Code Sample",
          "description": "Share a code snippet that showcases your skills",
          "options": {
            "language": "javascript",
            "multiline": true
          }
        }
      }
    },
    "additionalInfo": {
      "type": "object",
      "title": "Additional Information",
      "properties": {
        "coverLetter": {
          "type": "string",
          "format": "rich-text",
          "title": "Cover Letter",
          "description": "Tell us why you're perfect for this position"
        },
        "portfolioColor": {
          "type": "string",
          "format": "color",
          "title": "Portfolio Theme Color",
          "description": "Pick a color that represents your personal brand"
        },
        "referralCode": {
          "type": "string",
          "format": "pattern",
          "title": "Referral Code",
          "pattern": "^REF-\\d{6}$",
          "placeholder": "REF-123456",
          "description": "If you were referred, enter the referral code"
        }
      }
    }
  }
}
```

## Advanced Features

### Array Handling

While array support is currently limited to tags, you can create complex array-like structures using objects:

```json
{
  "type": "object",
  "title": "Work Experience",
  "properties": {
    "experience1": {
      "type": "object",
      "title": "Experience 1",
      "properties": {
        "company": {
          "type": "string",
          "title": "Company Name"
        },
        "position": {
          "type": "string",
          "title": "Position"
        },
        "duration": {
          "type": "number",
          "title": "Duration (years)"
        }
      }
    },
    "experience2": {
      "type": "object",
      "title": "Experience 2",
      "properties": {
        // Same structure as experience1
      }
    }
  }
}
```

### Advanced Validation

While the form provides basic validation through patterns and constraints, you can implement advanced validation in your application:

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateForm(data: any, schema: JsonSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Custom validation example
  if (schema.type === 'object' && schema.properties) {
    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (prop.type === 'string' && prop.format === 'email') {
        const email = data[key];
        if (email && !email.includes('@')) {
          errors.push({
            field: key,
            message: 'Invalid email format'
          });
        }
      }
      
      // Add your custom validation rules here
    });
  }

  return errors;
}
```

### Integration with Backend Validation

Example of integrating with backend validation:

```typescript
async function handleSubmit(formData: any, schema: JsonSchema) {
  // First, validate on the client
  const clientErrors = validateForm(formData, schema);
  if (clientErrors.length > 0) {
    return { success: false, errors: clientErrors };
  }

  try {
    // Then submit to backend
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      // Handle backend validation errors
      return { 
        success: false, 
        errors: result.errors 
      };
    }

    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      errors: [{ field: 'general', message: 'Submission failed' }]
    };
  }
}
```

## Common Patterns

### Conditional Fields
To show/hide fields based on other field values, use the pattern input:

```json
{
  "type": "object",
  "properties": {
    "employmentType": {
      "type": "string",
      "title": "Employment Type",
      "enum": ["fullTime", "contract"],
      "enumNames": ["Full Time", "Contract"]
    },
    "contractDuration": {
      "type": "number",
      "title": "Contract Duration (months)",
      "minimum": 1,
      "maximum": 24,
      "description": "Only required for contract positions"
    }
  }
}
```

### Multi-Step Forms
Break down complex forms into logical sections:

```json
{
  "type": "object",
  "properties": {
    "step1": {
      "type": "object",
      "title": "Basic Information",
      "properties": {
        // Step 1 fields
      }
    },
    "step2": {
      "type": "object",
      "title": "Detailed Information",
      "properties": {
        // Step 2 fields
      }
    }
  }
}
```

### Dynamic Dropdown Options
Use enums with corresponding labels:

```json
{
  "type": "string",
  "title": "Experience Level",
  "enum": ["entry", "mid", "senior", "lead"],
  "enumNames": ["Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (6-8 years)", "Lead (8+ years)"]
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Form Not Updating**
   - Ensure you're passing a new object reference to the `value` prop
   - Check that your onChange handler is updating the state correctly

2. **Validation Not Working**
   - Verify that your regex patterns are correctly escaped
   - Check that required fields are properly listed in the `required` array
   - Ensure number constraints (min/max) are appropriate

3. **Performance Issues**
   - Reduce the depth of nested objects
   - Consider splitting large forms into sections
   - Use appropriate input types (e.g., `type: "number"` for numeric inputs)

4. **Type Errors**
   - Ensure your schema matches the JsonSchema type
   - Check that enum values match their corresponding formats
   - Verify that numeric constraints are numbers, not strings

### Schema Validation

Use this TypeScript type guard to validate your schema:

```typescript
function isValidSchema(schema: unknown): schema is JsonSchema {
  if (!schema || typeof schema !== 'object') return false;
  
  // Check required properties
  const requiredProps = ['type', 'properties'];
  return requiredProps.every(prop => prop in schema);
}
```

## Tips for Complex Forms

1. **Input Dependencies**
```json
{
  "type": "object",
  "properties": {
    "hasCertification": {
      "type": "boolean",
      "title": "Do you have certifications?"
    },
    "certifications": {
      "type": "array",
      "format": "tags",
      "title": "List your certifications",
      "description": "Only if you answered yes above"
    }
  }
}
```

2. **Formatted Inputs with Validation**
```json
{
  "type": "string",
  "format": "pattern",
  "title": "Product Key",
  "pattern": "^[A-Z]{5}-\\d{5}-[A-Z]{2}$",
  "placeholder": "XXXXX-00000-XX",
  "description": "Enter the product key in the format XXXXX-00000-XX"
}
```

3. **Rich Content Fields**
```json
{
  "type": "object",
  "properties": {
    "projectDescription": {
      "type": "string",
      "format": "rich-text",
      "title": "Project Description",
      "description": "Describe your most significant project",
      "options": {
        "multiline": true
      }
    },
    "techStack": {
      "type": "array",
      "format": "tags",
      "title": "Technologies Used",
      "description": "List the technologies used in the project"
    }
  }
}
```

### Usage Example

```tsx
import { SchemaForm } from '@/components/SchemaForm'

export default function JobApplicationForm() {
  const [formData, setFormData] = useState({})
  const [schema, setSchema] = useState(/* The schema above */)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form data:', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <SchemaForm
        schema={schema}
        value={formData}
        onChange={setFormData}
      />
      <button type="submit">Submit Application</button>
    </form>
  )
}
```

## Important Notes

1. The `required` array at any level specifies which fields are mandatory. Required fields will be marked with an asterisk (*).

2. Each field can have:
   - `type`: The type of the field (required)
   - `title`: Label for the field (recommended)
   - `description`: Help text shown below the label (optional)
   - `placeholder`: Placeholder text for input fields (optional)
   - `format`: Special format for string fields (optional)
   - `minimum`/`maximum`: Range constraints for number fields (optional)
   - `enum`/`enumNames`: Options for select fields (optional)

3. Validation is performed based on:
   - Field type (string, number, boolean, etc.)
   - Required fields
   - Minimum/maximum values for numbers
   - Format constraints for strings

4. The schema structure is based on a subset of JSON Schema standard, but with some custom extensions like `enumNames` for better UX.

5. Arrays are currently not supported (coming in a future update).

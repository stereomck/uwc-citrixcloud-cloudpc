# Workflow System Documentation

## Overview

The Workflow System is a traceable, step-based automation framework designed for complex multi-step processes that require detailed logging, error handling, and performance monitoring. It's particularly well-suited for scenarios involving UI automation, OCR processing, and sequential task execution.

## Architecture

### Core Components

1. **WorkflowStep**: Represents a logical group of related actions
2. **WorkflowAction**: Individual atomic operations within a step  
3. **SessionWorkflowEngine**: Orchestrates execution of steps and actions
4. **WorkflowLogger**: Provides comprehensive logging and tracing
5. **OptimizedOCRManager**: High-performance OCR processing with caching

### Key Features

- **Complete Traceability**: Every step and action is logged with timestamps and performance metrics
- **Robust Error Handling**: Built-in retry logic and fallback mechanisms
- **Performance Optimization**: Memory-based processing and intelligent caching
- **Flexible Action Types**: Support for various automation operations
- **Dynamic Logging**: Automatic screenshot capture and detailed execution logs

## Basic Usage

### 1. Creating a Workflow

```csharp
// Initialize the workflow engine
var sessionId = Guid.NewGuid().ToString("N")[..8];
var workflowEngine = new SessionWorkflowEngine(sessionId);

// Create and add steps
var step1 = new WorkflowStep
{
    StepId = "LOGIN_PROCESS",
    StepName = "User Authentication",
    Actions = new List<WorkflowAction>
    {
        new OCRAction 
        { 
            ActionId = "FIND_LOGIN", 
            ActionName = "Locate Login Button", 
            Type = ActionType.OCR,
            ExpectedText = "Login",
            AlternativeTexts = new List<string> { "Sign In", "Enter" }
        },
        new WorkflowAction 
        { 
            ActionId = "CLICK_LOGIN", 
            ActionName = "Click Login Button", 
            Type = ActionType.Click,
            Parameters = new Dictionary<string, object> { {"targetText", "Login"} }
        }
    }
};

workflowEngine.AddStep(step1);
workflowEngine.ExecuteWorkflow();
```

### 2. Action Types

The system supports various action types:

```csharp
// OCR - Text recognition and location
new OCRAction
{
    ActionId = "DETECT_TEXT",
    ActionName = "Find Specific Text",
    Type = ActionType.OCR,
    ExpectedText = "Submit",
    AlternativeTexts = new List<string> { "OK", "Confirm", "Apply" },
    UseMemoryOCR = true, // Use high-performance memory-based OCR
    MaxRetries = 3
}

// Click - Mouse click or keyboard press
new WorkflowAction
{
    ActionId = "CLICK_BUTTON",
    ActionName = "Click Submit Button", 
    Type = ActionType.Click,
    Parameters = new Dictionary<string, object> 
    { 
        {"targetText", "Submit"} // Click at location of this text
    }
}

// Type - Text input
new WorkflowAction
{
    ActionId = "ENTER_DATA",
    ActionName = "Type Username",
    Type = ActionType.Type,
    Parameters = new Dictionary<string, object> 
    { 
        {"text", "user@example.com"} 
    }
}

// Wait - Pause execution
new WorkflowAction
{
    ActionId = "WAIT_LOAD",
    ActionName = "Wait for Page Load",
    Type = ActionType.Wait,
    Parameters = new Dictionary<string, object> 
    { 
        {"seconds", 5} 
    }
}

// Screenshot - Capture screen
new WorkflowAction
{
    ActionId = "CAPTURE_STATE",
    ActionName = "Take Screenshot",
    Type = ActionType.Screenshot
}
```

### 3. Error Handling and Retries

```csharp
var robustAction = new OCRAction
{
    ActionId = "FIND_DIALOG",
    ActionName = "Locate Dialog Box",
    Type = ActionType.OCR,
    ExpectedText = "Confirmation",
    IsOptional = false, // Step fails if this action fails
    MaxRetries = 5, // Retry up to 5 times
    AlternativeTexts = new List<string> { "Confirm", "Dialog", "Popup" }
};
```

### 4. Step Data Sharing

Steps can share data between actions:

```csharp
// Action that stores data
new WorkflowAction
{
    ActionId = "GENERATE_CODE",
    ActionName = "Create Verification Code",
    Type = ActionType.GenerateTOTP,
    Parameters = new Dictionary<string, object> { {"secret", "MYSECRET"} }
    // This action stores "TOTP_CODE" in step.StepData
}

// Action that uses stored data
new WorkflowAction
{
    ActionId = "ENTER_CODE",
    ActionName = "Type Verification Code",
    Type = ActionType.Type,
    Parameters = new Dictionary<string, object> 
    { 
        {"text", "{{TOTP_CODE}}"} // References data from previous action
    }
}
```

## Advanced Features

### OCR Performance Optimization

The system includes high-performance OCR processing:

```csharp
var ocrManager = new OptimizedOCRManager();

// Memory-based OCR (300-500ms vs 5000ms for file-based)
var result = ocrManager.FindText(
    expectedText: "Login", 
    alternativeTexts: new List<string> { "Sign In" },
    useCache: true // Uses 2-second screenshot cache
);

if (result.Found)
{
    Console.WriteLine($"Text '{result.FoundText}' found at ({result.Location.X}, {result.Location.Y})");
    Console.WriteLine($"Confidence: {result.Confidence:P1}");
}
```

### Custom Action Types

Extend the system with custom action types:

```csharp
public enum ActionType 
{ 
    OCR, Click, Type, Wait, Screenshot, WindowActivation, Verification,
    CustomAPI, // Custom action type
    DatabaseQuery,
    FileOperation
}

// In SessionWorkflowEngine.ExecuteActionAttempt()
case ActionType.CustomAPI:
    return ExecuteCustomAPIAction(action, step);

private bool ExecuteCustomAPIAction(WorkflowAction action, WorkflowStep step)
{
    try
    {
        var endpoint = action.Parameters["endpoint"].ToString();
        var payload = action.Parameters["payload"].ToString();
        
        // Custom API call logic here
        action.Result = $"API call successful to {endpoint}";
        return true;
    }
    catch (Exception ex)
    {
        action.ErrorMessage = $"API call failed: {ex.Message}";
        return false;
    }
}
```

### Timeout Management

The workflow engine automatically handles timeouts:

```csharp
// Built-in timeout monitoring (configurable)
public void ExecuteWorkflow()
{
    var workflowStartTime = DateTime.Now;
    
    foreach (var step in _steps)
    {
        var elapsed = DateTime.Now - workflowStartTime;
        if (elapsed.TotalSeconds > 170) // Configurable timeout
        {
            step.Status = StepStatus.Skipped;
            step.ErrorMessage = "Workflow timeout approaching - step skipped";
            continue;
        }
        
        ExecuteStep(step);
    }
}
```

## Logging and Tracing

### Automatic Logging

The system provides comprehensive logging out of the box:

```
[2024-08-29 14:30:22.123] WORKFLOW_INIT | SessionId: a1b2c3d4
[2024-08-29 14:30:22.125] STEP_ADDED | LOGIN_PROCESS | User Authentication | Actions: 2
[2024-08-29 14:30:22.127] WORKFLOW_START | Total Steps: 1
[2024-08-29 14:30:22.128] STEP_START | LOGIN_PROCESS | User Authentication | Actions: 2
[2024-08-29 14:30:22.130] ACTION_START | LOGIN_PROCESS | FIND_LOGIN | Locate Login Button | Type: OCR
[2024-08-29 14:30:22.135] SCREENSHOT | LOGIN_PROCESS | FIND_LOGIN | /path/to/screenshot.png
[2024-08-29 14:30:22.467] OCR_PERFORMANCE | Duration: 332ms | Found: True | Text: 'Login'
[2024-08-29 14:30:22.468] ACTION_COMPLETE | LOGIN_PROCESS | FIND_LOGIN | Status: Completed | Duration: 338ms | Result: Text found: 'Login' at (150, 200)
[2024-08-29 14:30:22.470] ACTION_START | LOGIN_PROCESS | CLICK_LOGIN | Click Login Button | Type: Click | Params: targetText=Login
[2024-08-29 14:30:22.475] ACTION_COMPLETE | LOGIN_PROCESS | CLICK_LOGIN | Status: Completed | Duration: 5ms | Result: Clicked at (150, 200)
[2024-08-29 14:30:22.476] STEP_COMPLETE | LOGIN_PROCESS | Status: Completed | Duration: 348ms | Actions: 2✓/0✗/2
[2024-08-29 14:30:22.477] WORKFLOW_COMPLETE | Duration: 350ms | Completed: 1/1
```

### Directory Structure

The system creates organized logging directories:

```
[Run Directory]/
├── logs/
│   ├── session_a1b2c3d4_20240829_143022.log
│   └── session_x7y8z9w0_20240829_143145.log
└── screenshots/
    ├── a1b2c3d4/
    │   ├── 20240829_143025_123_LOGIN_PROCESS_FIND_LOGIN.png
    │   └── 20240829_143027_456_LOGIN_PROCESS_CLICK_LOGIN.png
    └── x7y8z9w0/
        └── [session screenshots...]
```

## Best Practices

### 1. Step Organization

Group related actions into logical steps:

```csharp
// Good: Logical grouping
var authStep = new WorkflowStep
{
    StepId = "AUTHENTICATION",
    StepName = "Complete User Authentication",
    Actions = new List<WorkflowAction>
    {
        new OCRAction { /* Find login form */ },
        new WorkflowAction { /* Enter username */ },
        new WorkflowAction { /* Enter password */ },
        new WorkflowAction { /* Click login */ },
        new OCRAction { /* Verify success */ }
    }
};

// Avoid: Too many unrelated actions in one step
```

### 2. Error Resilience

Design actions with multiple fallback options:

```csharp
new OCRAction
{
    ExpectedText = "Submit",
    AlternativeTexts = new List<string> 
    { 
        "OK", "Apply", "Confirm", "Save", "Continue" 
    },
    MaxRetries = 3,
    IsOptional = false // Only for critical actions
}
```

### 3. Performance Optimization

Use caching effectively for repeated OCR operations:

```csharp
// Multiple OCR operations on the same screen
var step = new WorkflowStep
{
    Actions = new List<WorkflowAction>
    {
        new OCRAction { ExpectedText = "Username", UseMemoryOCR = true },
        new OCRAction { ExpectedText = "Password", UseMemoryOCR = true }, // Uses cached screenshot
        new OCRAction { ExpectedText = "Login", UseMemoryOCR = true }     // Uses cached screenshot
    }
};
```

### 4. Meaningful Identifiers

Use descriptive IDs and names:

```csharp
// Good
StepId = "USER_REGISTRATION"
ActionId = "VALIDATE_EMAIL_FORMAT"
ActionName = "Check Email Address Format"

// Avoid
StepId = "STEP1"
ActionId = "ACT1"
ActionName = "Do Something"
```

## Troubleshooting

### Common Issues

1. **OCR Not Finding Text**
   - Add alternative text options
   - Check screenshot quality
   - Verify text is visible on screen

2. **Performance Issues**
   - Enable memory-based OCR
   - Use screenshot caching
   - Reduce unnecessary screenshot captures

3. **Timeout Problems**
   - Adjust timeout thresholds
   - Optimize action execution time
   - Use optional actions for non-critical steps

### Debug Mode

Enable detailed logging for troubleshooting:

```csharp
// The logger automatically captures:
// - Screenshot before each visual action
// - Performance timing for all operations
// - Detailed error messages and stack traces
// - Retry attempts and outcomes
```

## Extending the System

The workflow system is designed to be extensible. You can:

- Add new action types
- Implement custom OCR engines
- Create specialized loggers
- Build domain-specific workflow steps
- Integrate with external systems

See the source code for implementation details and extension points.
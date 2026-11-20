// VAILDATION AND FEEDBACK
const infoMessage = document.getElementById("comments-info");

// ERROR HISTORY
let form_errors = [];


document.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
        // clear validity state
        field.setCustomValidity("");

        // get field's corresponding error message element
        const errorMessage = field.nextElementSibling;

        // check validity state
        if (field.validity.valid) {

            // hide error message
            errorMessage.style.display = "none";

            // show info message for comments field
            if (field.name == "comments") {
                infoMessage.style.display = "block";

                // CHARACTER COUNT
                if (field.value.length == field.maxLength) {
                    infoMessage.textContent = "Maximum length reached. (" + field.value.length + "/" + field.maxLength + ")";
                }
                else if (field.value.length > field.maxLength - 50) {
                    infoMessage.textContent = "Approaching maximum length. (" + field.value.length + "/" + field.maxLength + ")";
                }
                else {
                    infoMessage.textContent = "(" + field.value.length + "/" + field.maxLength + ")";
                }
            }

        } else {

            // show error message
            errorMessage.style.display = "block";
            
            // hide info message for comments field
            if (field.name === "comments") {
                infoMessage.style.display = "none";
            }

            // missing required values
            if (field.validity.valueMissing) {
                field.setCustomValidity("Please fill out this field.");
                errorMessage.textContent = "Please fill out this field.";
            }
            // invalid email format
            else if (field.validity.typeMismatch) {
                field.setCustomValidity("Please enter a valid email address, like john@example.com.");
                errorMessage.textContent = "Please enter a valid email address, like john@example.com.";
            }
            // text below the minimum length
            else if (field.validity.tooShort) {
                field.setCustomValidity("Please use more than " + field.minLength + " characters. (" + field.value.length + "/" + field.maxLength + ")");
                errorMessage.textContent = "Please use more than " + field.minLength + " characters. (" + field.value.length + "/" + field.maxLength + ")";
            }
        }
    });
});


// ERROR HISTORY
document.querySelector("button[type='submit']").addEventListener("click", (event) => {
    const form = event.target.form;
    if (!form.checkValidity()) {
        // record form error for each invalid field
        for (const field of form.elements) {
            if (!field.validity.valid) {
                form_errors.push("[" + field.name + "]: " + field.validationMessage);
            }
        }
    }
    else {
        // submit form error history as JSON string
        document.querySelector("input[name='form-errors']").value = JSON.stringify(form_errors);
    }
});
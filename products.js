$(function () {
   const storageKey = "studentClubProducts";
   let products = [];
   let editingId = null;

   function showMessage(message, isError = false) {
      $("#formMessage")
         .text(message)
         .removeClass("text-success text-danger")
         .addClass(isError ? "text-danger" : "text-success");
   }

   function saveProducts() {
      localStorage.setItem(storageKey, JSON.stringify(products));
      displayProducts();
   }

   function displayProducts() {
      const searchText = String($("#searchInput").val() || "").trim().toLowerCase();
      const tableBody = $("#productTableBody").empty();

      const matchingProducts = products.filter(function (item) {
         return [item.productId, item.description, item.category]
            .some(value => String(value).toLowerCase().includes(searchText));
      });

      matchingProducts.forEach(function (item) {
         const row = $("<tr>");
         [item.productId, item.description, item.category,
          item.unitOfMeasure, "$" + Number(item.price).toFixed(2),
          item.additionalInfo || ""].forEach(function (value) {
            row.append($("<td>").text(value));
         });

         const editButton = $("<button>")
            .attr("type", "button")
            .addClass("btn btn-warning btn-sm me-2")
            .text("Edit")
            .on("click", function () {
               editingId = item.productId;
               $("#productId").val(item.productId).prop("readOnly", true);
               $("#description").val(item.description);
               $("#category").val(item.category);
               $("#unitOfMeasure").val(item.unitOfMeasure);
               $("#price").val(item.price);
               $("#additionalInfo").val(item.additionalInfo || "");
               $("#submitProduct").text("Update Product");
               showMessage("Editing product " + item.productId);
            });

         const deleteButton = $("<button>")
            .attr("type", "button")
            .addClass("btn btn-danger btn-sm")
            .text("Delete")
            .on("click", function () {
               if (confirm("Delete " + item.description + "?")) {
                  products = products.filter(p => p.productId !== item.productId);
                  resetForm();
                  saveProducts();
                  showMessage("Product deleted.");
               }
            });

         row.append($("<td>").append(editButton, deleteButton));
         tableBody.append(row);
      });

      
      $("#jsonOutput").text(JSON.stringify(products, null, 2));
   }

   function resetForm() {
      $("#productForm")[0].reset();
      $("#productId").prop("readOnly", false);
      $("#submitProduct").text("Add Product");
      editingId = null;
   }

   $("#productForm").on("submit", function (event) {
      event.preventDefault();

      const productId = String($("#productId").val() || "").trim();
      const description = String($("#description").val() || "").trim();
      const category = String($("#category").val() || "").trim();
      const unitOfMeasure = String($("#unitOfMeasure").val() || "").trim();
      const priceText = String($("#price").val() || "").trim();
      const additionalInfo = String($("#additionalInfo").val() || "").trim();
      const price = Number(priceText);

      if (!productId || !description || !category || !unitOfMeasure || !priceText) {
         showMessage("Please fill out all required fields.", true);
         return;
      }
      if (!Number.isFinite(price) || price < 0) {
         showMessage("Price must be a valid number of 0 or greater.", true);
         return;
      }

      const product = { productId, description, category, unitOfMeasure, price, additionalInfo };

      if (editingId !== null) {
         const index = products.findIndex(item => item.productId === editingId);
         if (index === -1) {
            showMessage("Product to update was not found.", true);
            return;
         }
         products[index] = product;
         saveProducts();
         resetForm();
         showMessage("Product updated successfully!");
      } else {
         if (products.some(item => item.productId === productId)) {
            showMessage("That product ID already exists. Click Edit to update it.", true);
            return;
         }
         products.push(product);
         saveProducts();
         resetForm();
         showMessage("Product added successfully!");
      }
   });

   $("#searchInput").on("input", displayProducts);
   $("#cancelEdit").on("click", function () {
      resetForm();
      showMessage("");
   });

   $("#downloadJson").on("click", function () {
      const blob = new Blob([JSON.stringify(products, null, 2)], {
         type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
   });


   const saved = localStorage.getItem(storageKey);
   if (saved !== null) {
      try {
         const parsed = JSON.parse(saved);
         if (!Array.isArray(parsed)) throw new Error("Saved data must be an array");
         products = parsed;
         displayProducts();
      } catch (error) {
         showMessage("Saved JSON could not be read.", true);
      }
   } else {
      $.getJSON("products.json")
         .done(function (data) {
            if (!Array.isArray(data)) {
               showMessage("products.json must contain an array.", true);
               return;
            }
            products = data;
            saveProducts();
         })
         .fail(function () {
            showMessage("Could not load products.json.", true);
         });
   }
});

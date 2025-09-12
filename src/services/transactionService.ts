@@ .. @@
   static async createTransaction(data: TransactionPayload, userId: number) {
     const { categoryId, amount, description, date } = data;
+    
+    // Validaciones de entrada
+    if (!userId) {
+      throw new Error('ID de usuario no proporcionado');
+    }
+    if (!categoryId) {
+      throw new Error('ID de categoría no proporcionado');
+    }
+    if (amount <= 0) {
+      throw new Error('El monto debe ser mayor que cero');
+    }
+    if (!description?.trim()) {
+      throw new Error('La descripción es requerida');
+    }
+    
     const parsedDate = new Date(date);
     if (isNaN(parsedDate.getTime())) {
       throw new Error('Fecha inválida');
     }
-    if (!userId){
-        throw new Error('ID de usuario no proporcionado');
-    }
-    if (!categoryId) {
-      throw new Error('ID de categoría no proporcionado');
-    }
-    if (amount <= 0) {
-      throw new Error('El monto debe ser mayor que cero');
-    }
+    
+    // Verificar que la categoría existe
+    const categoryExists = await prisma.category.findUnique({
+      where: { id: categoryId }
+    });
+    if (!categoryExists) {
+      throw new Error('La categoría especificada no existe');
+    }
+    
     return await prisma.transaction.create({
       data: {
         amount,
-        description,
+        description: description.trim(),
         date: parsedDate,
         user: { connect: { id: userId } },
         category: { connect: { id: categoryId } },
       },
+      include: {
+        category: {
+          select: { id: true, name: true, type: true }
+        }
+      }
     });
   }
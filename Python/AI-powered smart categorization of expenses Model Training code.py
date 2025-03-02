# Step 0: Import Required Libraries
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import pickle
import kagglehub

# Download the dataset from Kaggle using kagglehub (ensure kagglehub is configured correctly)
path = kagglehub.dataset_download("jg7fujhfydhgc/expenses-2024")
print("Path to dataset files:", path)

# Step 1: Load the Dataset
# Make sure you're using the correct CSV file; here we use 'expenses_income_summary.csv'
df = pd.read_csv('expenses_income_summary.csv')
print("First few rows of the dataset:")
print(df.head())

# Standardize column names to lower-case
df.columns = df.columns.str.lower()
print("Columns in DF:", df.columns)


df['title'] = df['title'].fillna('').astype(str)
df['description'] = df['description'].fillna('').astype(str)
df['combined_text'] = df['title'] + ' ' + df['description']

# Dropped rows missing 'category' (assume 'category' is essential)
df.dropna(subset=['category'], inplace=True)
print("DataFrame shape after dropna on category:", df.shape)

# Step 2: Prepare Input and Output Data
# Used 'combined_text' as the feature and 'category' as the label.
texts = df['combined_text'].values
categories = df['category'].values

# Encoded the category labels into integers
label_encoder = LabelEncoder()
categories_encoded = label_encoder.fit_transform(categories)
num_classes = len(label_encoder.classes_)
print("Number of categories:", num_classes)

# Step 3: Splitted the Data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    texts, categories_encoded, test_size=0.2, random_state=42)
print("Training samples:", len(X_train), "Test samples:", len(X_test))

# Step 4: Vectorized the Transaction Descriptions Using TF-IDF
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
X_train_vect = vectorizer.fit_transform(X_train).toarray()
X_test_vect = vectorizer.transform(X_test).toarray()

# Convert labeled to one-hot encoded vectors
y_train_cat = to_categorical(y_train, num_classes)
y_test_cat = to_categorical(y_test, num_classes)

# Step 5: Builded the Neural Network Model Using Keras
input_dim = X_train_vect.shape[1]
model = Sequential([
    Dense(512, activation='relu', input_shape=(input_dim,)),
    Dense(256, activation='relu'),
    Dense(num_classes, activation='softmax')
])
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# Step 6: Trained the Model
history = model.fit(X_train_vect, y_train_cat,
                    epochs=10,              # Increased epochs if needed
                    batch_size=32,
                    validation_data=(X_test_vect, y_test_cat))

# Step 7: Evaluated the Model
loss, accuracy = model.evaluate(X_test_vect, y_test_cat)
print("Test Accuracy:", accuracy)

# Step 8: Saved the Trained Model and Preprocessing Tools
model.save('expense_classifier.h5')  # Saved the Keras model

with open('vectorizer.pkl', 'wb') as f:
    pickle.dump(vectorizer, f)

with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(label_encoder, f)

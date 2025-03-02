import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import pickle
import matplotlib.pyplot as plt
import seaborn as sns


# Loaded the dataset with columns: Date, Transaction Description, Category, Amount, Type
data = pd.read_csv('Personal_Finance_Dataset.csv')

# Converted the Date column to datetime and create a YearMonth column for aggregation
data['Date'] = pd.to_datetime(data['Date'])
data['YearMonth'] = data['Date'].dt.to_period('M').astype(str)

print("Dataset Shape:", data.shape)
print("Columns:", data.columns.tolist())
print("\nFirst 5 rows:")
print(data.head())

# -------------------------------
# 2. Aggregated Data by Month
# -------------------------------
# For each month, we calculated:
#   - total_income: Sum of Amount for rows where Type == 'Income'
#   - total_expense: Sum of Amount for rows where Type == 'Expense'
#   - savings: total_income - total_expense
#   - savings_percentage: (savings / total_income) * 100 (if income > 0, else 0)
#   - recommendation: based on savings_percentage thresholds

def aggregate_month(group):
    total_income = group.loc[group['Type'] == 'Income', 'Amount'].sum()
    total_expense = group.loc[group['Type'] == 'Expense', 'Amount'].sum()
    savings = total_income - total_expense
    savings_percentage = (savings / total_income * 100) if total_income > 0 else 0
    # Define recommendation based on savings percentage thresholds
    if savings_percentage < 10:
        recommendation = "Increase Savings"
    elif savings_percentage <= 20:
        recommendation = "Maintain Spending"
    else:
        recommendation = "Invest More"
    return pd.Series({
        'total_income': total_income,
        'total_expense': total_expense,
        'savings': savings,
        'savings_percentage': savings_percentage,
        'recommendation': recommendation
    })

# Grouped by YearMonth and aggregate
monthly_data = data.groupby('YearMonth').apply(aggregate_month).reset_index()

print("\nMonthly Aggregated Data:")
print(monthly_data.head())

# Optional: Save monthly data to CSV for inspection
monthly_data.to_csv('monthly_cash_flow.csv', index=False)

# -------------------------------
# 3. Exploratory Data Analysis (Optional)
# -------------------------------
# Plot correlation heatmap for numerical features in the monthly data
numerical_cols = ['total_income', 'total_expense', 'savings_percentage']
plt.figure(figsize=(8, 6))
sns.heatmap(monthly_data[numerical_cols].corr(), annot=True, cmap="coolwarm")
plt.title("Monthly Data Correlation Heatmap")
plt.savefig("monthly_correlation_heatmap.png")
plt.close()
print("Correlation heatmap saved as 'monthly_correlation_heatmap.png'.")

# -------------------------------
# 4. Prepared Data for Modeling
# -------------------------------
# We will use total_income, total_expense, and savings_percentage as features,
# and the generated recommendation as the target.
features = ['total_income', 'total_expense', 'savings_percentage']
target = 'recommendation'

# Dropped any rows with missing values (if any)
monthly_data.dropna(inplace=True)

X = monthly_data[features]
y = monthly_data[target]

# Normalized numerical features using StandardScaler
scaler = StandardScaler()
X[features] = scaler.fit_transform(X[features])

# -------------------------------
# 5. Split, Train, and Evaluate the Model
# -------------------------------
# Split the aggregated data into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a RandomForestClassifier
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Predicted on the test set and evaluate
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print("\nTest Accuracy:", acc)
print("\nClassification Report:")
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# -------------------------------
# 6. Saved the Trained Model for Backend Integration
# -------------------------------
# Saved the model along with the scaler and feature list for later use in your backend
model_data = {
    'model': clf,
    'scaler': scaler,
    'features': features
}
with open('cash_flow_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("Model training complete and saved as 'cash_flow_model.pkl'")

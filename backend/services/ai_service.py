import os
from openai import OpenAI
from models.models import Expense, User

class RoommateAIService:
    @staticmethod
    def _get_client():
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            return None
        try:
            return OpenAI(api_key=api_key)
        except Exception:
            return None

    @classmethod
    def get_roommate_system_prompt(cls, user_name, expenses_summary):
        return (
            f"You are 'SpendWise AI', the strict but friendly financial roommate of a hostel student named {user_name}. "
            "Your personality: witty, informal, slightly sarcastic but highly caring, and use hostel slangs (like 'bro', 'maggi', 'tapri', 'canteen', 'pocket money', 'night-out'). "
            "You are helping them manage their money. You give logical financial tips mixed with emotional roommate advice. "
            f"Here is their current spending summary: {expenses_summary}. "
            "Keep your responses concise, highly engaging, formatted in clean markdown, and focused on helping them survive the month. "
            "Detect emotional spending (e.g., stress-eating, impulse shopping) and hostel-specific spending (canteen, tea, late-night snacks, printouts)."
        )

    @classmethod
    def get_spending_summary_text(cls, expenses):
        if not expenses:
            return "No expenses logged yet. They are currently at 0 spending. Tell them to start logging!"
            
        total = sum(e.amount for e in expenses)
        categories = {}
        for e in expenses:
            categories[e.category] = categories.get(e.category, 0) + e.amount
            
        summary = f"Total: {total} Rs. Categories breakdown: "
        summary += ", ".join([f"{cat}: {amt} Rs" for cat, amt in categories.items()])
        
        # Get latest expense
        latest = expenses[0]
        summary += f". Latest expense: {latest.amount} Rs on {latest.category} for '{latest.note or 'no note'}' on {latest.date}."
        return summary

    @classmethod
    def generate_chat_response(cls, user_id, message):
        # Fetch user and expenses for context
        user = User.query.get(user_id)
        user_name = user.name if user else "Roomie"
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        
        summary_text = cls.get_spending_summary_text(expenses)
        system_prompt = cls.get_roommate_system_prompt(user_name, summary_text)
        
        client = cls._get_client()
        if client:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo", # default cheap and fast model
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=400,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                # Fallback on API failure
                print(f"OpenAI API error: {e}")
                pass
                
        # Rule-based fallback (The Smart Roommate Agent)
        return cls._generate_mock_roommate_response(user_name, message, expenses)

    @classmethod
    def analyze_spending(cls, user_id):
        user = User.query.get(user_id)
        user_name = user.name if user else "Roomie"
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        
        if not expenses:
            return (
                "### Hey there, Roomie! 👋\n\n"
                "You haven't logged any expenses yet. My database is as empty as a hostel mess on a Sunday night!\n\n"
                "**Action Plan:** Add your first few expenses (canteen, tea, rent, printouts, etc.) so I can start roasting your spending choices!"
            )
            
        summary_text = cls.get_spending_summary_text(expenses)
        
        client = cls._get_client()
        if client:
            try:
                analysis_prompt = (
                    "Provide a detailed financial analysis of the student's expenses. Structure it with:\n"
                    "1. **Overall Health Status** (Give a humorous grade like A+ or 'F for Broke')\n"
                    "2. **Emotional Spending Detection** (Spot late-night spending, stress-purchases, or peer pressure spending)\n"
                    "3. **Hostel Pattern Highlights** (Talk about Maggi, chai tapri, canteen, or books)\n"
                    "4. **Future Prediction** (Will they survive until the end of the month?)\n"
                    "5. **Smart Roommate Saving Tips** (Specific steps to save 10-20%)\n"
                    "Act like their witty, strict financial roommate. Format nicely using markdown headings and bullet points."
                )
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": cls.get_roommate_system_prompt(user_name, summary_text)},
                        {"role": "user", "content": analysis_prompt}
                    ],
                    max_tokens=600,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI API analysis error: {e}")
                pass
                
        # Rule-based analysis
        return cls._generate_mock_analysis(user_name, expenses)

    @classmethod
    def _generate_mock_roommate_response(cls, user_name, message, expenses):
        msg = message.lower()
        total_spending = sum(e.amount for e in expenses)
        
        # Categorized spendings
        categories = {}
        for e in expenses:
            categories[e.category] = categories.get(e.category, 0) + e.amount
            
        highest_cat = max(categories, key=categories.get) if categories else "Nothing"
        highest_amt = categories.get(highest_cat, 0)
        
        # Smart keyword matching
        if "overspend" in msg or "why" in msg or "roast" in msg or "bad" in msg:
            if total_spending == 0:
                return f"Bro {user_name}, you haven't logged any expenses! How can I roast you for overspending if you are spending literally 0? Log some items first!"
            
            response = f"### ⚠️ ROAST TIME: Let's check the damage, {user_name}...\n\n"
            response += f"You've already blown **{total_spending:,.2f} Rs**! And your biggest money sink is **{highest_cat}** at **{highest_amt:,.2f} Rs**.\n\n"
            
            if highest_cat == "Food":
                response += "🍔 **Food Roast**: Are you eating at the mess or ordering gourmet burgers every night? Mess food isn't *that* bad, bro. Skip Swiggy/Zomato for the next 5 days or you'll be begging roommates for dry Maggi packets.\n"
            elif highest_cat == "Travel":
                response += "🚗 **Travel Roast**: Running around in auto-rickshaws or Ubers? Walk a bit! It's good for your legs and your wallet. Reserve travel for returning home or real emergencies, not for visiting the tea stall 500m away.\n"
            elif highest_cat == "Shopping":
                response += "🛍️ **Shopping Roast**: Bro, shopping in college? You're building a wardrobe or a gadget collection when you should be building a savings account! Do you really need that extra hoodie? Ask yourself if you're buying it because you're bored.\n"
            else:
                response += f"💸 **{highest_cat} Roast**: You're spending too much here. Keep it in check before pocket money runs out!\n"
                
            response += "\n**Roommate Verdict**: Lock your credit card in your drawer and eat hostel mess food. Yes, even the yellow watery dal."
            return response
            
        elif "save" in msg or "advice" in msg or "tips" in msg or "help" in msg:
            return (
                f"### 💡 Roomie's Saving Guide for {user_name}\n\n"
                "Okay, let's get serious. If you want to survive till the 30th without eating newspaper, do this:\n\n"
                "1. **The 5-Minute Rule**: When you want to buy something online, close the tab and wait 24 hours. Usually, you'll forget about it. If you don't, check if it costs more than 10 plates of canteen samosas.\n"
                "2. **Group Chai Splits**: Stop paying for everyone's chai at the tapri. Use Splitwise or SpendWise and make sure they pay you back immediately. No 'I will transfer tonight' lies!\n"
                "3. **Late-Night Maggie Stock**: Buy Maggie packets in bulk from a supermarket instead of buying cooked Maggie at 2 AM from the local stall. Saves you 60% of late-night cravings cost.\n\n"
                "Try it for a week. Your bank account will thank me."
            )
            
        elif "budget" in msg or "predict" in msg or "future" in msg:
            predicted_end = total_spending * 1.5
            return (
                f"### 🔮 The Roommate Oracle Predicts...\n\n"
                f"Based on your current speed of throwing cash (**{total_spending:,.2f} Rs** logged), "
                f"you are projected to spend around **{predicted_end:,.2f} Rs** by the end of this cycle.\n\n"
                "🚨 **Alert Status**: " + ("RED ALERT! You're going to be flat broke by mid-month. Stop spending now!" if total_spending > 3000 else "YELLOW ALERT: Moderate spending, but watch out for weekend splurges.") + "\n\n"
                "**Smart Suggestion**: Set a strict daily cap of **150 Rs** for the next 7 days to stabilize your budget."
            )
            
        # Default roommate greeting / chatter
        return (
            f"Hey {user_name}! I'm your SpendWise financial roommate. 🛌\n\n"
            f"Currently, you've spent a total of **{total_spending:,.2f} Rs**, mostly on **{highest_cat}**.\n\n"
            "Ask me anything like:\n"
            "- *\"Why am I overspending?\"* (for a roast)\n"
            "- *\"Give me tips to save money\"* (for actionable tips)\n"
            "- *\"Predict my future budget\"* (for AI predictions)"
        )

    @classmethod
    def _generate_mock_analysis(cls, user_name, expenses):
        total = sum(e.amount for e in expenses)
        categories = {}
        for e in expenses:
            categories[e.category] = categories.get(e.category, 0) + e.amount
            
        highest_cat = max(categories, key=categories.get) if categories else "None"
        highest_amt = categories.get(highest_cat, 0)
        
        # Analyze hostel patterns
        food_spend = categories.get("Food", 0)
        shopping_spend = categories.get("Shopping", 0)
        travel_spend = categories.get("Travel", 0)
        
        grade = "B-"
        if total > 5000:
            grade = "F (Extremely Broke)"
        elif total > 3000:
            grade = "D (Pocket Money Depleted)"
        elif total > 1500:
            grade = "C (Mess food is your destiny)"
        else:
            grade = "A (Financial Legend)"
            
        analysis = (
            f"## 📊 Roommate's Deep Financial Audit for {user_name}\n\n"
            f"### 1. Overall Health Grade: `{grade}`\n"
            f"You have spent **{total:,.2f} Rs** in total. "
        )
        
        if total > 3000:
            analysis += "Bro, you are treating pocket money like it's a tech startup funding round. Chill out! 🛑\n\n"
        else:
            analysis += "Not bad, you still have some cash left. But don't let down your guard yet! 🛡️\n\n"
            
        analysis += "### 2. 🧠 Emotional Spending Detection\n"
        if shopping_spend > 1000:
            analysis += "- **Impulse Shopping Alert**: You spent a solid chunk of cash on Shopping. Were you bored after a lecture or stressed about exams? Buying stuff won't make the syllabus shorter, bro!\n"
        if food_spend > 1500:
            analysis += "- **Mess Avoidance Syndrome**: A lot of food bills logged! You are clearly running away from the hostel mess. Mess food is paid for in advance; you are paying twice for food! Stop ordering late-night snacks.\n"
        if not (shopping_spend > 1000 or food_spend > 1500):
            analysis += "- **Good emotional discipline**: You're mostly spending on necessities. Keep resisting the urge to buy random things during late-night discussions.\n"
            
        analysis += "\n### 3. 🏫 Hostel Lifestyle Spending Patterns\n"
        if food_spend > 0:
            analysis += f"- **Late-night cravings**: Food accounts for **{(food_spend/total*100):.1f}%** of your total expenses. Samosas, tea, and pizzas are slowly leaking your money.\n"
        if travel_spend > 0:
            analysis += f"- **Cabs and Autos**: Travel represents **{(travel_spend/total*100):.1f}%** of your budget. Share autos or start walking to the campus gate.\n"
            
        analysis += (
            f"\n### 4. 🔮 Future Budget Prediction\n"
            f"- If you keep spending like this, you will need **{(total * 1.4):,.2f} Rs** to finish the month.\n"
            f"- **Recommendation**: Establish a **'No-Spend Day'** once a week where you spend exactly 0 Rs (eat mess food, stay in the hostel room, watch movies on local LAN/WiFi).\n\n"
            f"### 5. 💡 Smart Saving Suggestions\n"
            f"- **Avoid Group Tea Peer Pressure**: Don't say 'I got this' when hanging out at the local chai tapri. Split every single Rupee.\n"
            f"- **Stock Up on Staples**: Buy biscuits and Maggi packets from wholesale grocery stores, not the local convenience shop.\n"
            f"- **Sell Old Notes/Books**: Clear your desk space, sell old reference materials, and put that cash straight back into your food budget."
        )
        
        return analysis

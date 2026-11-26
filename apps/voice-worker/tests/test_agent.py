import unittest

from billpilot_voice_worker.agent import amount_in_words


class AmountSpeechTests(unittest.TestCase):
    def test_speaks_server_balance_in_indian_number_groups(self):
        self.assertEqual(amount_in_words("19470.00", "INR"), "nineteen thousand four hundred seventy rupees")

    def test_speaks_paise_without_rounding(self):
        self.assertEqual(amount_in_words("25.75", "INR"), "twenty five rupees and seventy five paise")

    def test_handles_zero(self):
        self.assertEqual(amount_in_words("0.00", "INR"), "zero rupees")


if __name__ == "__main__":
    unittest.main()

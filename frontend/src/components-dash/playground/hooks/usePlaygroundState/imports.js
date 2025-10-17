import { useState, useMemo, useContext, useEffect, useRef } from "react";
import { aiModels, aiGoals } from "../../utils/configData";
import { UserDataContext } from "../../../../context-dash/UserDataContext";
import {
  findMatchingGoalKey,
  normalizeGoalString,
  findMatchingModelKey,
  normalizeModelString
} from "../../../../utils-dash/formatUtils";
import { chatService } from "../../../../api-dash/services/chat.service";
import { webScraperService } from "../../../../api-dash/services/webscraper.service";
import { setValueAtPath } from "../../../../utils-dash/chatUtils";
import { supabase } from "../../../../lib-dash/supabase";
